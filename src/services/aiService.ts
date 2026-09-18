import { AppSettings, PromptAnalysisResult } from '@/types';
import { getSettings } from './storage';

const SYSTEM_PROMPT = `You are "BetterPrompt", the world-class Prompt Doctor & Engineering Assistant (like Grammarly, but for Generative & Conversational AI).
Your mission is to analyze the user's raw prompt, diagnose its quality, and generate 3 levels of superior alternatives that prevent wasted credits and time.

Output MUST be a strictly valid JSON object with the following structure (no markdown fences, no explanatory text outside JSON):
{
  "originalPrompt": string,
  "category": "image" | "code" | "writing" | "reasoning" | "general",
  "categoryLabel": "이미지 생성" | "코드 개발" | "콘텐츠/글쓰기" | "추론/분석" | "일반 질문",
  "qualityScore": number (10 to 100 integer reflecting clarity, style, specificity, context),
  "summaryDiagnosis": "한 줄 진단 요약 (예: 단순 요구형 프롬프트로 세부 스타일과 구도가 결여되어 원치 않는 결과가 나올 확률이 높습니다.)",
  "weaknesses": [
    {
      "id": "w1",
      "title": "약점 제목 (예: 화풍 및 스타일 미지정)",
      "explanation": "구체적 문제점 설명",
      "severity": "high" | "medium" | "low"
    }
  ],
  "strengths": [
    "장점 1",
    "장점 2"
  ],
  "options": {
    "quick": {
      "id": "quick",
      "title": "⚡ 빠른 보정 (Quick Polish)",
      "tag": "핵심 명확화",
      "description": "원문 의도를 그대로 살리면서 문맥과 명확성을 빠르게 다듬은 버전",
      "prompt": "개선된 프롬프트 내용",
      "whyItWorks": "AI가 모호함을 해석하느라 엉뚱한 답을 내지 않도록 핵심 지시어를 명확히 했습니다."
    },
    "expert": {
      "id": "expert",
      "title": "🧠 전문가형 구조화 (Structured Prompt)",
      "tag": "역할·맥락·제약조건",
      "description": "페르소나, 목표, 세부 제약사항, 출력 형식까지 완벽히 설계된 고품질 프롬프트",
      "prompt": "[역할]\\n[목표]\\n[지침 및 제약사항]\\n[출력 형식]",
      "whyItWorks": "AI에게 역할과 경계조건을 명확히 부여하여 할루시네이션을 방지하고 전문적인 결과물을 보장합니다."
    },
    "engine": {
      "id": "engine",
      "title": "🎨 Midjourney / FLUX 특화 (Engine-Specific)",
      "tag": "하이퍼 디테일",
      "description": "이미지의 경우 영문 비주얼 키워드 + 카메라/조명/화풍 + 파라미터(--ar 16:9 등), 텍스트/코딩의 경우 극대화된 벤치마크급 프롬프트",
      "prompt": "상세한 특화 프롬프트",
      "whyItWorks": "모델(Midjourney v6.1 / FLUX.1)이 가장 민감하게 반응하는 시각적 메타데이터와 영문 태그를 완벽 조합했습니다.",
      "parameters": {
        "aspect_ratio": "--ar 16:9",
        "version": "--v 6.1",
        "style": "--style raw"
      }
    }
  }
}

CRITICAL RULES:
1. If the user prompt is about generating an image (e.g. "고양이 그려줘", "사이버펑크 서울 거리 만들어줘", "로고 디자인"), category MUST be "image", and the 'engine' prompt MUST be high-detail English optimized for Midjourney v6 / FLUX.1 with lighting, camera (e.g., shot on 35mm lens, volumetric lighting, photorealistic, 8k), and parameters (--ar 16:9 --v 6.1 --stylize 250).
2. Explanations and UI labels should be in Korean for Korean prompts, or match user preference.
3. Be brutally honest with the qualityScore. A simple "~해줘" prompt should get 20~45.
4. Return ONLY valid raw JSON.`;

export async function analyzePromptWithAI(
  promptText: string,
  customSettings?: Partial<AppSettings>
): Promise<PromptAnalysisResult> {
  const settings = { ...(await getSettings()), ...(customSettings || {}) };

  // If no API key provided, fall back to realistic intelligent heuristics / demo generator
  if (!settings.apiKey || settings.apiKey.trim() === '') {
    console.warn('BetterPrompt: No OpenCode Go API key provided. Using intelligent local generation.');
    return generateFallbackAnalysis(promptText, settings);
  }

  // Check if we are running in Chrome Extension content script
  // In extension content scripts, fetch can be blocked by host page CSP. We route via background worker.
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage && !chrome.runtime.getBackgroundPage) {
    try {
      const response = await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: 'ANALYZE_PROMPT',
            payload: { promptText, settings },
          },
          (res) => {
            if (chrome.runtime.lastError) {
              return reject(new Error(chrome.runtime.lastError.message));
            }
            if (res && res.error) {
              return reject(new Error(res.error));
            }
            resolve(res);
          }
        );
      });

      if (response && response.data) {
        return response.data;
      }
    } catch (err) {
      console.warn('Background message failed, attempting direct fetch:', err);
    }
  }

  // Direct fetch (used in background script, popup, or standalone demo)
  return callDeepSeekDirect(promptText, settings);
}

export async function callDeepSeekDirect(
  promptText: string,
  settings: AppSettings
): Promise<PromptAnalysisResult> {
  const baseUrl = (settings.baseUrl || 'https://opencode.ai/zen/go/v1').replace(/\/+$/, '');
  const endpoint = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : `${baseUrl}/chat/completions`;

  const model = settings.model || 'deepseek-v4.1-flash';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze and enhance this user prompt:\n"""\n${promptText}\n"""\nTarget Language: ${settings.preferredLanguage}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenCode Go API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('No content returned from DeepSeek model');
  }

  try {
    const cleanJson = rawContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed: PromptAnalysisResult = JSON.parse(cleanJson);
    return parsed;
  } catch (parseErr) {
    console.error('Failed to parse DeepSeek JSON response:', rawContent, parseErr);
    throw new Error('Invalid JSON format received from AI model');
  }
}

export async function testApiConnection(
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const startTime = Date.now();
  const cleanBase = (baseUrl || 'https://opencode.ai/zen/go/v1').replace(/\/+$/, '');
  const endpoint = cleanBase.endsWith('/chat/completions')
    ? cleanBase
    : `${cleanBase}/chat/completions`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: model || 'deepseek-v4.1-flash',
        messages: [{ role: 'user', content: 'Say "OK" in 1 word.' }],
        max_tokens: 10,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        latencyMs,
        message: `HTTP ${res.status}: ${errText.slice(0, 150)}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      latencyMs,
      message: `연결 성공! (${model} 응답: ${data.choices?.[0]?.message?.content?.trim() || 'OK'})`,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      message: err?.message || '네트워크 연결 오류',
    };
  }
}

/**
 * Intelligent local fallback when no API key is provided yet,
 * providing realistic DeepSeek V4.1 Flash styled responses for immediate evaluation.
 */
function generateFallbackAnalysis(
  promptText: string,
  settings: AppSettings
): PromptAnalysisResult {
  const text = promptText.trim();
  const isImage = /(그려|이미지|사진|그림|일러스트|포스터|배경|캐릭터|디자인|draw|paint|picture|photo|midjourney|flux)/i.test(text);
  const isCode = /(코드|개발|함수|컴포넌트|리액트|버그|파이썬|api|code|react|typescript|python|fix|function)/i.test(text);
  const isWriting = /(글|작성|블로그|이메일|보고서|카피|대본|write|blog|email|copy)/i.test(text);

  let category: PromptAnalysisResult['category'] = 'general';
  let categoryLabel = '일반 질문';

  if (isImage) {
    category = 'image';
    categoryLabel = '이미지 생성';
  } else if (isCode) {
    category = 'code';
    categoryLabel = '코드 개발';
  } else if (isWriting) {
    category = 'writing';
    categoryLabel = '콘텐츠/글쓰기';
  }

  // Calculate quality score based on length and richness
  const wordCount = text.split(/\s+/).length;
  let qualityScore = Math.min(Math.max(Math.round(wordCount * 5 + (text.length > 30 ? 15 : 5)), 25), 65);

  if (category === 'image') {
    return {
      originalPrompt: text,
      category: 'image',
      categoryLabel: '이미지 생성',
      qualityScore,
      summaryDiagnosis: '화풍, 카메라 렌즈, 조명 조건 및 종횡비 메타데이터가 누락되어 원하는 이미지가 생성될 확률이 낮습니다.',
      weaknesses: [
        {
          id: 'w1',
          title: '화풍 및 아트 스타일 미지정',
          explanation: '실사(Photorealistic), 3D 렌더, 애니메이션 등 구체적인 매체가 명시되지 않아 AI가 임의로 화풍을 선택합니다.',
          severity: 'high',
        },
        {
          id: 'w2',
          title: '조명 및 카메라 앵글 부재',
          explanation: '시네마틱 조명, 골든아워, 렌즈 초점거리(예: 35mm, 85mm)가 없어 입체감이 떨어집니다.',
          severity: 'medium',
        },
        {
          id: 'w3',
          title: '엔진 파라미터 미포함',
          explanation: '미드저니/FLUX 특유의 종횡비(--ar 16:9), 버전(--v 6.1), 스타일화 수치가 누락되었습니다.',
          severity: 'low',
        },
      ],
      strengths: ['핵심 피사체/주제가 명확함'],
      options: {
        quick: {
          id: 'quick',
          title: '⚡ 빠른 보정 (Quick Polish)',
          tag: '핵심 명확화',
          description: '원문 의도를 그대로 살리며 고품질 디테일을 추가한 프롬프트',
          prompt: `${text}, 고해상도 시네마틱 디테일, 입체적인 볼륨 조명, 8K 마스터피스 스타일`,
          whyItWorks: '단순한 서술에 시각적 품질 수식어를 추가하여 AI가 텍스처와 조명을 정교하게 표현하도록 유도합니다.',
        },
        expert: {
          id: 'expert',
          title: '🧠 전문가형 구조화 (Structured Prompt)',
          tag: '구도·조명·세부묘사',
          description: '피사체, 배경, 조명, 색감 톤앤매너를 논리적으로 분리 기술',
          prompt: `[Subject]: ${text}\n[Art Style]: Hyper-realistic digital concept art, octane render style\n[Lighting]: Cinematic golden hour lighting with soft volumetric haze\n[Composition]: Wide-angle shot, rule of thirds, ultra-detailed background\n[Color Palette]: Vibrant neon accents with deep moody contrasts`,
          whyItWorks: '각 구성 요소를 체계적으로 분류하여 이미지 생성 AI가 요소 간 충돌 없이 정확한 시각 요소를 배치합니다.',
        },
        engine: {
          id: 'engine',
          title: '🎨 Midjourney / FLUX 특화 (Engine-Specific)',
          tag: '영문 키워드 + 파라미터',
          description: '미드저니 v6.1 및 FLUX.1 생성에 최적화된 영문 카메라/조명 메타데이터',
          prompt: `Cinematic shot of ${text}, photorealistic, shot on Sony A7R V with 35mm f/1.4 GM lens, dramatic volumetric lighting, intricate cyberpunk aesthetic, highly detailed textures, ray tracing reflections, 8k resolution --ar 16:9 --v 6.1 --stylize 250 --style raw`,
          whyItWorks: '미드저니는 영문 전문 사진 용어(카메라 기종, 조리개값, 조명 기법)와 파라미터(--ar, --stylize)를 인식할 때 디테일이 비약적으로 향상됩니다.',
          parameters: {
            aspect_ratio: '--ar 16:9',
            engine: '--v 6.1',
            style: '--style raw',
          },
        },
      },
    };
  }

  // General / Coding / Writing fallback
  return {
    originalPrompt: text,
    category,
    categoryLabel,
    qualityScore,
    summaryDiagnosis: '지시가 단편적이며 AI의 역할(Role), 제약 조건(Constraints), 출력 형식(Output Format)이 지정되지 않았습니다.',
    weaknesses: [
      {
        id: 'w1',
        title: '역할 및 전문성(Persona) 미부여',
        explanation: 'AI에게 어떤 전문가로서 응답해야 하는지 명시하지 않아 일반론적인 답변이 나올 가능성이 큽니다.',
        severity: 'high',
      },
      {
        id: 'w2',
        title: '출력 형식 및 제약사항 부재',
        explanation: '불필요한 인사말이나 서론이 길어질 수 있으며 원하는 포맷(마크다운 표, 코드 블록)이 누락되었습니다.',
        severity: 'medium',
      },
    ],
    strengths: ['요청의 기본 의도가 직관적임'],
    options: {
      quick: {
        id: 'quick',
        title: '⚡ 빠른 보정 (Quick Polish)',
        tag: '명확성 강화',
        description: '지침을 구체화하고 핵심 요구사항을 한눈에 정리',
        prompt: `다음 작업에 대해 군더더기 없이 핵심과 실용적인 예시를 중심으로 설명해줘:\n${text}`,
        whyItWorks: '불필요한 서론을 없애고 즉시 사용 가능한 실용적 정보에 집중하게 만듭니다.',
      },
      expert: {
        id: 'expert',
        title: '🧠 전문가형 구조화 (Structured Prompt)',
        tag: 'Role-Task-Format',
        description: '최상위 성능을 이끌어내는 프롬프트 엔지니어링 4대 원칙 적용',
        prompt: `[역할]: 해당 분야의 10년 차 수석 전문가\n[목표]: ${text}에 대한 심층적이고 실행 가능한 솔루션 제시\n[제약사항]:\n- 추상적인 설명은 지양하고 구체적인 실행 단계 및 코드/예시 포함\n- 잠재적 위험이나 주의해야 할 엣지 케이스 명시\n[출력 형식]: 1) 핵심 요약 2) 단계별 실행 가이드 3) 실전 팁`,
        whyItWorks: 'Role-Task-Constraint-Format 구조를 적용하여 AI의 할루시네이션을 방지하고 상용 수준의 산출물을 얻습니다.',
      },
      engine: {
        id: 'engine',
        title: '🚀 DeepSeek V4.1 추론 특화 (CoT Prompt)',
        tag: '단계별 심층 추론',
        description: 'DeepSeek 모델의 사고(Thinking) 능력을 극대화하는 Chain-of-Thought 프롬프트',
        prompt: `Think step-by-step before answering.\nUser Request: ${text}\nFirst, analyze the underlying requirements and edge cases. Then, provide the optimal, production-ready solution with clean explanations.`,
        whyItWorks: 'DeepSeek V4.1 Flash의 Chain-of-Thought 추론 메커니즘을 활성화하여 정확도와 깊이를 극대화합니다.',
      },
    },
  };
}
