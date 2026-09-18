import { AppSettings, PromptAnalysisResult, BackendTestResult } from '@/types';
import { getSettings } from './storage';

export async function analyzePromptWithAI(
  promptText: string,
  customSettings?: Partial<AppSettings>
): Promise<PromptAnalysisResult> {
  const settings = { ...(await getSettings()), ...(customSettings || {}) };

  // Check if we are running in a valid Chrome Extension content script context
  const isExtensionContextValid =
    typeof chrome !== 'undefined' &&
    Boolean(chrome.runtime && chrome.runtime.id && chrome.runtime.sendMessage);

  if (isExtensionContextValid && !chrome.runtime.getBackgroundPage) {
    try {
      const response = await new Promise<any>((resolve, reject) => {
        try {
          if (!chrome.runtime?.id) {
            return reject(new Error('Extension context invalidated'));
          }
          chrome.runtime.sendMessage(
            {
              type: 'ANALYZE_PROMPT',
              payload: { promptText, settings },
            },
            (res) => {
              if (chrome.runtime?.lastError) {
                return reject(new Error(chrome.runtime.lastError.message));
              }
              if (res && res.error) {
                return reject(new Error(res.error));
              }
              resolve(res);
            }
          );
        } catch (syncErr) {
          reject(syncErr);
        }
      });

      if (response && response.data) {
        return response.data;
      }
    } catch (err) {
      console.warn('Background message failed (context invalidated or CSP), falling back to direct fetch:', err);
    }
  }

  // Direct fetch (used in background script, popup, standalone demo, or as safe fallback)
  return callBackendAnalyze(promptText, settings);
}

function getClientSessionId(): string {
  try {
    let sid = localStorage.getItem('better_prompt_session_id');
    if (!sid) {
      sid = 'session_ext_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
      localStorage.setItem('better_prompt_session_id', sid);
    }
    return sid;
  } catch {
    return 'session_fallback_' + Date.now();
  }
}

export const BACKEND_SERVER_URL = 'https://prompt.devleo.us';

export async function callBackendAnalyze(
  promptText: string,
  settings: AppSettings
): Promise<PromptAnalysisResult> {
  const endpoint = `${BACKEND_SERVER_URL}/api/analyze`;
  const sessionId = getClientSessionId();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-opencode-session': sessionId,
      },
      body: JSON.stringify({
        prompt: promptText,
        preferredLanguage: settings.preferredLanguage || 'ko',
        sessionId,
        deepThinking: Boolean(settings.deepThinkingEnabled),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`백엔드 서버 응답 오류 (${response.status}): ${errText.slice(0, 100)}`);
    }

    const data: PromptAnalysisResult = await response.json();
    return sanitizeAnalysisResult(data, settings.preferredLanguage || 'ko');
  } catch (err: any) {
    console.warn(`Failed to connect to BetterPrompt backend at ${endpoint}:`, err);
    // Return high quality fallback analysis with a note
    return generateFallbackAnalysis(promptText, settings);
  }
}

export async function testBackendConnection(
  backendUrl: string
): Promise<BackendTestResult> {
  // If in Chrome Extension content script, route via background worker to bypass page CSP restrictions
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage && !chrome.runtime.getBackgroundPage) {
    try {
      const response = await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: 'TEST_CONNECTION',
            payload: { backendUrl },
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
      console.warn('Background TEST_CONNECTION failed, attempting direct fetch:', err);
    }
  }

  const startTime = Date.now();
  const endpoint = `${BACKEND_SERVER_URL}/api/health`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
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
      message: `연결 정상 (${data.model || 'mimo-v2.5'})`,
      model: data.model,
      uptime: data.uptime,
      environment: data.environment,
      isProduction: Boolean(data.isProduction || data.environment === 'production'),
      isDocker: Boolean(data.isDocker),
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      message: err?.message || '백엔드 서버에 연결할 수 없습니다. (CORS 또는 서버 오프라인)',
    };
  }
}

export async function enhanceImageWithBackend(
  promptText: string,
  engine: string,
  aspectRatio?: string,
  settings?: AppSettings
): Promise<any> {
  const endpoint = `${BACKEND_SERVER_URL}/api/enhance-image`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: promptText,
        engine,
        aspectRatio: aspectRatio || '16:9',
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend image enhancement failed, using local format:', err);
  }

  return {
    engine,
    originalPrompt: promptText,
    enhancedPrompt: `Cinematic shot of ${promptText}, photorealistic 8k --ar ${aspectRatio || '16:9'} --v 6.1`,
    parameters: { '--ar': aspectRatio || '16:9', '--v': '6.1' },
    suggestions: ['백엔드 연결 대기 중 - 로컬 프리셋 생성됨'],
  };
}

/**
 * Sanitizes AI analysis output to strictly remove or translate any leaked Chinese
 * terminology (e.g. 提示词, 角色, 约束) and remove Japanese Kana/Kanji.
 */
export function sanitizeAnalysisResult(
  result: PromptAnalysisResult,
  targetLang: string
): PromptAnalysisResult {
  const isEn = targetLang === 'en';

  const cleanText = (str: string | undefined): string => {
    if (!str) return '';
    let text = str;

    if (!isEn) {
      // Korean target: replace known Chinese prompt terminology with natural Korean
      const replacements: [RegExp, string][] = [
        [/提示词/g, '프롬프트'],
        [/\[\s*角色\s*\]/g, '[역할]'],
        [/角色/g, '역할'],
        [/\[\s*约束条件\s*\]/g, '[제약사항]'],
        [/\[\s*约束\s*\]/g, '[제약사항]'],
        [/约束条件/g, '제약사항'],
        [/约束/g, '제약사항'],
        [/\[\s*输出格式\s*\]/g, '[출력 형식]'],
        [/输出格式/g, '출력 형식'],
        [/\[\s*目标\s*\]/g, '[목표]'],
        [/目标/g, '목표'],
        [/\[\s*背景\s*\]/g, '[배경]'],
        [/背景/g, '배경'],
        [/\[\s*任务\s*\]/g, '[작업]'],
        [/任务/g, '작업'],
        [/\[\s*思考\s*\]/g, '[추론]'],
        [/思考/g, '추론'],
        [/\[\s*示例\s*\]/g, '[예시]'],
        [/示例/g, '예시'],
        [/优化/g, '최적화'],
        [/参数/g, '매개변수'],
        [/结构化/g, '구조화'],
        [/弱点/g, '취약점'],
        [/建议/g, '추천'],
        [/高质量/g, '고품질'],
        [/专家/g, '전문가'],
        [/要求/g, '요구사항'],
        [/原则/g, '원칙'],
        [/规则/g, '규칙'],
        [/上下文/g, '컨텍스트'],
        [/步骤/g, '단계'],
        [/说明/g, '설명'],
        [/回答/g, '답변'],
        [/核心/g, '핵심'],
        [/内容/g, '내용'],
        [/分析/g, '분석'],
        [/生成/g, '생성'],
        [/语言/g, '언어'],
        [/中文/g, '한국어'],
        [/英文/g, '영어'],
        [/日文/g, '일본어'],
      ];

      for (const [pattern, rep] of replacements) {
        text = text.replace(pattern, rep);
      }

      // Remove Japanese Kana (Hiragana & Katakana)
      text = text.replace(/[\u3040-\u309F\u30A0-\u30FF]+/g, '');

      // Remove any leftover Chinese Hanzi
      text = text.replace(/[\u4E00-\u9FFF]+/g, '');
    } else {
      // English target: strip any Chinese, Japanese, or Korean characters that might leak
      text = text.replace(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]+/g, '');
    }

    // Clean up empty brackets and double spaces
    text = text.replace(/\[\s*\]/g, '').replace(/  +/g, ' ').trim();
    return text;
  };

  return {
    ...result,
    summaryDiagnosis: cleanText(result.summaryDiagnosis),
    categoryLabel: cleanText(result.categoryLabel),
    weaknesses: (result.weaknesses || []).map((w) => ({
      ...w,
      title: cleanText(w.title),
      explanation: cleanText(w.explanation),
    })),
    strengths: (result.strengths || []).map((s) => cleanText(s)),
    options: {
      quick: {
        ...result.options?.quick,
        title: cleanText(result.options?.quick?.title),
        tag: cleanText(result.options?.quick?.tag),
        description: cleanText(result.options?.quick?.description),
        prompt: cleanText(result.options?.quick?.prompt),
        whyItWorks: cleanText(result.options?.quick?.whyItWorks),
      },
      expert: {
        ...result.options?.expert,
        title: cleanText(result.options?.expert?.title),
        tag: cleanText(result.options?.expert?.tag),
        description: cleanText(result.options?.expert?.description),
        prompt: cleanText(result.options?.expert?.prompt),
        whyItWorks: cleanText(result.options?.expert?.whyItWorks),
      },
      engine: {
        ...result.options?.engine,
        title: cleanText(result.options?.engine?.title),
        tag: cleanText(result.options?.engine?.tag),
        description: cleanText(result.options?.engine?.description),
        prompt: cleanText(result.options?.engine?.prompt),
        whyItWorks: cleanText(result.options?.engine?.whyItWorks),
      },
    },
  };
}

/**
 * Intelligent local fallback when backend is temporarily offline or unreachable,
 * guaranteeing the user never experiences broken UI or halted workflows.
 */
function generateFallbackAnalysis(
  promptText: string,
  settings: AppSettings
): PromptAnalysisResult {
  const text = promptText.trim();
  const isEn = (settings.preferredLanguage || 'ko') === 'en';
  const isImage = /(그려|이미지|사진|그림|일러스트|포스터|배경|캐릭터|디자인|draw|paint|picture|photo|midjourney|flux)/i.test(text);
  const isCode = /(코드|개발|함수|컴포넌트|리액트|버그|파이썬|api|code|react|typescript|python|fix|function)/i.test(text);
  const isWriting = /(글|작성|블로그|이메일|보고서|카피|대본|write|blog|email|copy)/i.test(text);

  let category: PromptAnalysisResult['category'] = 'general';
  let categoryLabel = isEn ? 'General Prompt' : '일반 질문';

  if (isImage) {
    category = 'image';
    categoryLabel = isEn ? 'Image Generation' : '이미지 생성';
  } else if (isCode) {
    category = 'code';
    categoryLabel = isEn ? 'Code & Development' : '코드 개발';
  } else if (isWriting) {
    category = 'writing';
    categoryLabel = isEn ? 'Content & Writing' : '콘텐츠/글쓰기';
  }

  const wordCount = text.split(/\s+/).length;
  let qualityScore = Math.min(Math.max(Math.round(wordCount * 5 + (text.length > 30 ? 15 : 5)), 25), 65);

  if (category === 'image') {
    if (isEn) {
      return {
        originalPrompt: text,
        category: 'image',
        categoryLabel: 'Image Generation',
        qualityScore,
        summaryDiagnosis: 'Missing art style, camera optics, lighting conditions, and engine aspect ratio parameters.',
        weaknesses: [
          {
            id: 'w1',
            title: 'Unspecified Art Style',
            explanation: 'Photorealistic, 3D octane render, or illustration is unspecified, forcing the AI to guess.',
            severity: 'high',
          },
          {
            id: 'w2',
            title: 'No Lighting or Angle Details',
            explanation: 'Lacks cinematic lighting (e.g. golden hour, volumetric haze) and lens focal length (e.g. 35mm, 85mm).',
            severity: 'medium',
          },
          {
            id: 'w3',
            title: 'Missing Engine Parameters',
            explanation: 'Aspect ratio (--ar 16:9), model version (--v 6.1), and stylize flags are omitted.',
            severity: 'low',
          },
        ],
        strengths: ['Core visual subject is clearly identified'],
        options: {
          quick: {
            id: 'quick',
            title: '⚡ Quick Polish',
            tag: 'Clarity & Detail',
            description: 'Preserves your original concept while adding high-fidelity visual rendering tags',
            prompt: `${text}, highly detailed, cinematic lighting, photorealistic textures, 8k resolution`,
            whyItWorks: 'Adds professional visual keywords so image generation models compute realistic light and texture layers.',
          },
          expert: {
            id: 'expert',
            title: '🧠 Structured Prompt',
            tag: 'Lighting & Composition',
            description: 'Logically separates subject, environment, lighting, and camera optics',
            prompt: `[Subject]: ${text}\n[Art Style]: Hyper-realistic digital concept art, octane render style\n[Lighting]: Cinematic golden hour lighting with soft volumetric haze\n[Composition]: Wide-angle shot, rule of thirds, ultra-detailed background\n[Color Palette]: Vibrant accents with deep atmospheric contrasts`,
            whyItWorks: 'Structured component separation prevents visual bleeding and aligns image diffusion layers cleanly.',
          },
          engine: {
            id: 'engine',
            title: '🎨 Midjourney / FLUX Spec',
            tag: 'Optics & Parameters',
            description: 'Optimized for Midjourney v6.1 and FLUX.1 with camera optics and parameters',
            prompt: `Cinematic shot of ${text}, photorealistic, shot on Sony A7R V with 35mm f/1.4 GM lens, dramatic volumetric lighting, intricate aesthetic, highly detailed textures, ray tracing reflections, 8k resolution --ar 16:9 --v 6.1 --stylize 250 --style raw`,
            whyItWorks: 'Midjourney parameters and photographic lens keywords unlock maximum rendering fidelity.',
            parameters: {
              aspect_ratio: '--ar 16:9',
              engine: '--v 6.1',
              style: '--style raw',
            },
          },
        },
      };
    }

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
          prompt: `Cinematic shot of ${text}, photorealistic, shot on Sony A7R V with 35mm f/1.4 GM lens, dramatic volumetric lighting, intricate aesthetic, highly detailed textures, ray tracing reflections, 8k resolution --ar 16:9 --v 6.1 --stylize 250 --style raw`,
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

  if (isEn) {
    return {
      originalPrompt: text,
      category,
      categoryLabel,
      qualityScore,
      summaryDiagnosis: 'The instruction is minimal and lacks an assigned persona, execution constraints, or explicit output format.',
      weaknesses: [
        {
          id: 'w1',
          title: 'No Expert Persona Assigned',
          explanation: 'Without defining an expert role, the AI generates generic, surface-level responses.',
          severity: 'high',
        },
        {
          id: 'w2',
          title: 'Missing Constraints & Format',
          explanation: 'Lacks required format (markdown tables, code blocks) and bounds, causing verbose fluff.',
          severity: 'medium',
        },
      ],
      strengths: ['Core intent is direct and understandable'],
      options: {
        quick: {
          id: 'quick',
          title: '⚡ Quick Polish',
          tag: 'Clarity Boost',
          description: 'Streamlines requirements and requests direct, actionable examples',
          prompt: `Provide a concise, practical breakdown with concrete examples for the following task:\n${text}`,
          whyItWorks: 'Eliminates conversational filler and focuses directly on actionable knowledge.',
        },
        expert: {
          id: 'expert',
          title: '🧠 Structured Prompt',
          tag: 'Role-Task-Format',
          description: 'Applies prompt engineering best practices with persona and constraints',
          prompt: `[Role]: Senior Principal Specialist in the field\n[Objective]: Provide an in-depth, production-grade solution for: ${text}\n[Constraints]:\n- Avoid abstract explanations; include concrete execution steps and code/examples\n- Highlight potential edge cases or security risks\n[Output Format]: 1) Executive Summary 2) Step-by-Step Implementation 3) Best Practices`,
          whyItWorks: 'Role-Task-Constraint-Format guarantees robust, production-ready outputs without hallucinations.',
        },
        engine: {
          id: 'engine',
          title: '🚀 Deep Reasoning (CoT)',
          tag: 'Chain-of-Thought',
          description: 'Activates multi-step logical reasoning before generating the final answer',
          prompt: `Think step-by-step before answering.\nUser Request: ${text}\nFirst, analyze the underlying requirements, trade-offs, and edge cases. Then, provide the optimal, production-ready solution with clean explanations.`,
          whyItWorks: 'Forces the model to utilize reasoning tokens to verify logic before delivering the final answer.',
        },
      },
    };
  }

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
        title: '🚀 심층 추론 특화 (CoT Prompt)',
        tag: '단계별 심층 추론',
        description: 'AI 모델의 사고(Thinking) 능력을 극대화하는 Chain-of-Thought 프롬프트',
        prompt: `Think step-by-step before answering.\nUser Request: ${text}\nFirst, analyze the underlying requirements and edge cases. Then, provide the optimal, production-ready solution with clean explanations.`,
        whyItWorks: 'Chain-of-Thought 심층 추론 메커니즘을 활성화하여 정확도와 깊이를 극대화합니다.',
      },
    },
  };
}
