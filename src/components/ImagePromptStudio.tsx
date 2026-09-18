import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { analyzePromptWithAI } from '@/services/aiService';
import {
  Sparkles,
  Copy,
  Check,
  Camera,
  Sun,
  Palette,
  Ratio,
  Cpu,
  RefreshCw,
  Plus,
} from 'lucide-react';

const ART_STYLES = [
  { id: 'photo', label: '극사실 실사', value: 'photorealistic 8k, hyper-detailed skin texture, raw photo' },
  { id: 'cyberpunk', label: '사이버펑크', value: 'cyberpunk aesthetic, vibrant neon reflections, gritty futuristic atmosphere' },
  { id: 'anime', label: '지브리/애니', value: 'Studio Ghibli style, vibrant colors, lush painted scenery, anime masterwork' },
  { id: '3d_octane', label: '3D 옥테인', value: '3D isometric octane render, clean clay texture, raytracing, blender 3d' },
  { id: 'cinematic', label: '영화 스틸컷', value: 'cinematic movie still, 35mm film grain, moody color grading' },
  { id: 'oil_paint', label: '유화 클래식', value: 'fine art oil painting, textured brushstrokes, classical masterpiece' },
];

const LIGHTINGS = [
  { id: 'golden', label: '골든아워', value: 'warm golden hour sunlight, soft natural lens flare' },
  { id: 'volumetric', label: '빛줄기 (God Rays)', value: 'dramatic volumetric god rays, dusty atmospheric haze' },
  { id: 'neon', label: '네온 림라이트', value: 'vivid neon rim lighting, dual-tone cyan and magenta glow' },
  { id: 'studio', label: '스튜디오 소프트', value: 'commercial studio softbox lighting, clean even shadows' },
  { id: 'noir', label: '필름 누아르', value: 'dramatic chiaroscuro lighting, deep mysterious shadows' },
];

const CAMERAS = [
  { id: 'portrait_85', label: '85mm 인물 (보케)', value: 'shot on 85mm f/1.4 lens, shallow depth of field, creamy bokeh' },
  { id: 'street_35', label: '35mm 거리 스냅', value: 'shot on Leica 35mm f/2, documentary street photography' },
  { id: 'wide_16', label: '16mm 광각 웅장', value: 'ultra wide-angle 16mm lens, dynamic perspective, sweeping scale' },
  { id: 'macro', label: '100mm 접사', value: 'macro 100mm close-up, extreme microscopic details, sharp focal plane' },
  { id: 'drone', label: '드론 항공 촬영', value: 'high altitude drone aerial shot, bird-eye perspective' },
];

const ASPECT_RATIOS = [
  { id: '16_9', label: '16:9 와이드', param: '--ar 16:9' },
  { id: '9_16', label: '9:16 숏폼', param: '--ar 9:16' },
  { id: '1_1', label: '1:1 정사각', param: '--ar 1:1' },
  { id: '4_5', label: '4:5 인스타', param: '--ar 4:5' },
  { id: '21_9', label: '21:9 시네마', param: '--ar 21:9' },
];

const ENGINES = [
  { id: 'mj', label: 'Midjourney v6.1', param: '--v 6.1 --stylize 250' },
  { id: 'flux', label: 'FLUX.1 Dev', param: '--quality 2' },
  { id: 'sdxl', label: 'SDXL', param: 'masterpiece, best quality' },
  { id: 'dalle', label: 'DALL-E 3', param: 'HD, highly detailed, vibrant aesthetic' },
];

export const ImagePromptStudio: React.FC<{ onApply?: (text: string) => void }> = ({
  onApply,
}) => {
  const [subject, setSubject] = useState('');

  // Category selections (id or 'custom' or null)
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>('photo');
  const [customStyle, setCustomStyle] = useState('');

  const [selectedLightingId, setSelectedLightingId] = useState<string | null>('golden');
  const [customLighting, setCustomLighting] = useState('');

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>('portrait_85');
  const [customCamera, setCustomCamera] = useState('');

  const [selectedRatioId, setSelectedRatioId] = useState<string | null>('16_9');
  const [customRatio, setCustomRatio] = useState('');

  const [selectedEngineId, setSelectedEngineId] = useState<string | null>('mj');
  const [customEngine, setCustomEngine] = useState('');

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Realtime prompt assembly
  const assembledPrompt = React.useMemo(() => {
    const parts: string[] = [];
    if (subject.trim()) {
      parts.push(subject.trim());
    } else {
      parts.push('[피사체 / 주제를 입력하세요]');
    }

    // 1. Style
    if (selectedStyleId === 'custom') {
      if (customStyle.trim()) parts.push(customStyle.trim());
    } else if (selectedStyleId) {
      const s = ART_STYLES.find((item) => item.id === selectedStyleId);
      if (s?.value) parts.push(s.value);
    }

    // 2. Lighting
    if (selectedLightingId === 'custom') {
      if (customLighting.trim()) parts.push(customLighting.trim());
    } else if (selectedLightingId) {
      const l = LIGHTINGS.find((item) => item.id === selectedLightingId);
      if (l?.value) parts.push(l.value);
    }

    // 3. Camera
    if (selectedCameraId === 'custom') {
      if (customCamera.trim()) parts.push(customCamera.trim());
    } else if (selectedCameraId) {
      const c = CAMERAS.find((item) => item.id === selectedCameraId);
      if (c?.value) parts.push(c.value);
    }

    // 4. Target Engine
    if (selectedEngineId === 'custom') {
      if (customEngine.trim()) parts.push(customEngine.trim());
    } else if (selectedEngineId) {
      const e = ENGINES.find((item) => item.id === selectedEngineId);
      if (e?.param) parts.push(e.param);
    }

    // 5. Aspect Ratio
    if (selectedRatioId === 'custom') {
      if (customRatio.trim()) {
        const val = customRatio.trim();
        parts.push(val.startsWith('--ar') ? val : `--ar ${val}`);
      }
    } else if (selectedRatioId) {
      const r = ASPECT_RATIOS.find((item) => item.id === selectedRatioId);
      if (r?.param) parts.push(r.param);
    }

    return parts.join(', ');
  }, [
    subject,
    selectedStyleId,
    customStyle,
    selectedLightingId,
    customLighting,
    selectedCameraId,
    customCamera,
    selectedEngineId,
    customEngine,
    selectedRatioId,
    customRatio,
  ]);

  const handleDeepSeekEnhance = async () => {
    if (!subject.trim()) return;
    setIsEnhancing(true);

    try {
      const queryParts: string[] = [subject.trim()];

      if (selectedStyleId === 'custom' && customStyle.trim()) {
        queryParts.push(`화풍: ${customStyle.trim()}`);
      } else if (selectedStyleId) {
        const s = ART_STYLES.find((item) => item.id === selectedStyleId);
        if (s) queryParts.push(s.label);
      }

      if (selectedLightingId === 'custom' && customLighting.trim()) {
        queryParts.push(`조명: ${customLighting.trim()}`);
      } else if (selectedLightingId) {
        const l = LIGHTINGS.find((item) => item.id === selectedLightingId);
        if (l) queryParts.push(l.label);
      }

      if (selectedCameraId === 'custom' && customCamera.trim()) {
        queryParts.push(`카메라/구도: ${customCamera.trim()}`);
      } else if (selectedCameraId) {
        const c = CAMERAS.find((item) => item.id === selectedCameraId);
        if (c) queryParts.push(c.label);
      }

      if (selectedRatioId === 'custom' && customRatio.trim()) {
        queryParts.push(`종횡비: ${customRatio.trim()}`);
      } else if (selectedRatioId) {
        const r = ASPECT_RATIOS.find((item) => item.id === selectedRatioId);
        if (r) queryParts.push(`종횡비 ${r.label}`);
      }

      if (selectedEngineId === 'custom' && customEngine.trim()) {
        queryParts.push(`엔진/파라미터: ${customEngine.trim()}`);
      } else if (selectedEngineId) {
        const e = ENGINES.find((item) => item.id === selectedEngineId);
        if (e) queryParts.push(`엔진 ${e.label}`);
      }

      const promptQuery = queryParts.join(', ');
      const analysis = await analyzePromptWithAI(promptQuery);
      if (analysis.options.engine) {
        setEnhancedResult(analysis.options.engine.prompt);
      } else {
        setEnhancedResult(analysis.options.expert.prompt);
      }
    } catch (e: any) {
      console.error(e);
      setEnhancedResult(assembledPrompt);
    } finally {
      setIsEnhancing(false);
    }
  };

  const currentDisplayPrompt = enhancedResult || assembledPrompt;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDisplayPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentRatioParam = React.useMemo(() => {
    if (selectedRatioId === 'custom') {
      if (!customRatio.trim()) return '--ar 커스텀';
      return customRatio.trim().startsWith('--ar') ? customRatio.trim() : `--ar ${customRatio.trim()}`;
    }
    return ASPECT_RATIOS.find((r) => r.id === selectedRatioId)?.param || '';
  }, [selectedRatioId, customRatio]);

  return (
    <div className="space-y-4">
      {/* Subject Input */}
      <div className="space-y-1.5">
        <Label htmlFor="image-subject" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5" />
          핵심 피사체 / 콘셉트
        </Label>
        <Input
          id="image-subject"
          placeholder="예: 비오는 밤거리의 사이버펑크 고양이, 한복을 입은 소녀, 신비로운 숲"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setEnhancedResult(null);
          }}
          className="text-sm h-9"
        />
      </div>

      {/* 1. Style Presets Grid */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Palette className="w-3.5 h-3.5" />
            화풍 및 아트 스타일
          </Label>
          {selectedStyleId && (
            <span className="text-[10px] text-muted-foreground">
              {selectedStyleId === 'custom' ? (customStyle || '직접 입력') : ART_STYLES.find(s => s.id === selectedStyleId)?.label}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {ART_STYLES.map((style) => (
            <Button
              key={style.id}
              type="button"
              variant={selectedStyleId === style.id ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs justify-start px-2.5 font-normal truncate"
              onClick={() => {
                setSelectedStyleId(prev => prev === style.id ? null : style.id);
                setEnhancedResult(null);
              }}
            >
              {style.label}
            </Button>
          ))}
          <Button
            type="button"
            variant={selectedStyleId === 'custom' ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs justify-start px-2.5 font-normal border-dashed col-span-3"
            onClick={() => {
              setSelectedStyleId(prev => prev === 'custom' ? null : 'custom');
              setEnhancedResult(null);
            }}
          >
            <Plus className="w-3 h-3 mr-1 text-muted-foreground" />
            기타 화풍 직접 입력
          </Button>
        </div>
        {selectedStyleId === 'custom' && (
          <Input
            placeholder="원하는 화풍/스타일을 직접 입력하세요 (예: 수채화, 픽셀아트, 흑백 펜화)"
            value={customStyle}
            onChange={(e) => {
              setCustomStyle(e.target.value);
              setEnhancedResult(null);
            }}
            className="text-xs h-8 mt-1.5"
            autoFocus
          />
        )}
      </div>

      {/* 2 & 3. Lighting & Camera */}
      <div className="grid grid-cols-2 gap-3">
        {/* Lighting */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sun className="w-3.5 h-3.5" />
              조명 및 무드
            </Label>
          </div>
          <div className="space-y-1">
            {LIGHTINGS.map((light) => (
              <Button
                key={light.id}
                type="button"
                variant={selectedLightingId === light.id ? "default" : "outline"}
                size="sm"
                className="w-full h-7 text-xs justify-start px-2 font-normal truncate"
                onClick={() => {
                  setSelectedLightingId(prev => prev === light.id ? null : light.id);
                  setEnhancedResult(null);
                }}
              >
                {light.label}
              </Button>
            ))}
            <Button
              type="button"
              variant={selectedLightingId === 'custom' ? "default" : "outline"}
              size="sm"
              className="w-full h-7 text-xs justify-start px-2 font-normal border-dashed"
              onClick={() => {
                setSelectedLightingId(prev => prev === 'custom' ? null : 'custom');
                setEnhancedResult(null);
              }}
            >
              <Plus className="w-3 h-3 mr-1 text-muted-foreground" />
              기타 (직접 입력)
            </Button>
            {selectedLightingId === 'custom' && (
              <Input
                placeholder="조명/무드 직접 입력"
                value={customLighting}
                onChange={(e) => {
                  setCustomLighting(e.target.value);
                  setEnhancedResult(null);
                }}
                className="text-xs h-7 mt-1"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* Camera */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Camera className="w-3.5 h-3.5" />
              카메라 및 앵글
            </Label>
          </div>
          <div className="space-y-1">
            {CAMERAS.map((cam) => (
              <Button
                key={cam.id}
                type="button"
                variant={selectedCameraId === cam.id ? "default" : "outline"}
                size="sm"
                className="w-full h-7 text-xs justify-start px-2 font-normal truncate"
                onClick={() => {
                  setSelectedCameraId(prev => prev === cam.id ? null : cam.id);
                  setEnhancedResult(null);
                }}
              >
                {cam.label}
              </Button>
            ))}
            <Button
              type="button"
              variant={selectedCameraId === 'custom' ? "default" : "outline"}
              size="sm"
              className="w-full h-7 text-xs justify-start px-2 font-normal border-dashed"
              onClick={() => {
                setSelectedCameraId(prev => prev === 'custom' ? null : 'custom');
                setEnhancedResult(null);
              }}
            >
              <Plus className="w-3 h-3 mr-1 text-muted-foreground" />
              기타 (직접 입력)
            </Button>
            {selectedCameraId === 'custom' && (
              <Input
                placeholder="카메라/구도 직접 입력"
                value={customCamera}
                onChange={(e) => {
                  setCustomCamera(e.target.value);
                  setEnhancedResult(null);
                }}
                className="text-xs h-7 mt-1"
                autoFocus
              />
            )}
          </div>
        </div>
      </div>

      {/* 4 & 5. Aspect Ratio & Engine */}
      <div className="grid grid-cols-2 gap-3">
        {/* Aspect Ratio */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Ratio className="w-3.5 h-3.5" />
            종횡비 (Aspect Ratio)
          </Label>
          <div className="space-y-1">
            {ASPECT_RATIOS.map((r) => (
              <Button
                key={r.id}
                type="button"
                variant={selectedRatioId === r.id ? "default" : "outline"}
                size="sm"
                className="w-full h-7 text-xs justify-start px-2 font-normal"
                onClick={() => {
                  setSelectedRatioId(prev => prev === r.id ? null : r.id);
                  setEnhancedResult(null);
                }}
              >
                {r.label}
              </Button>
            ))}
            <Button
              type="button"
              variant={selectedRatioId === 'custom' ? "default" : "outline"}
              size="sm"
              className="w-full h-7 text-xs justify-start px-2 font-normal border-dashed"
              onClick={() => {
                setSelectedRatioId(prev => prev === 'custom' ? null : 'custom');
                setEnhancedResult(null);
              }}
            >
              <Plus className="w-3 h-3 mr-1 text-muted-foreground" />
              기타 (직접 입력)
            </Button>
            {selectedRatioId === 'custom' && (
              <Input
                placeholder="비율 직접 입력 (예: 3:2, 2:3)"
                value={customRatio}
                onChange={(e) => {
                  setCustomRatio(e.target.value);
                  setEnhancedResult(null);
                }}
                className="text-xs h-7 mt-1"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* Target Engine */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Cpu className="w-3.5 h-3.5" />
            타겟 모델
          </Label>
          <div className="space-y-1">
            {ENGINES.map((eng) => (
              <Button
                key={eng.id}
                type="button"
                variant={selectedEngineId === eng.id ? "default" : "outline"}
                size="sm"
                className="w-full h-7 text-xs justify-start px-2 font-normal"
                onClick={() => {
                  setSelectedEngineId(prev => prev === eng.id ? null : eng.id);
                  setEnhancedResult(null);
                }}
              >
                {eng.label}
              </Button>
            ))}
            <Button
              type="button"
              variant={selectedEngineId === 'custom' ? "default" : "outline"}
              size="sm"
              className="w-full h-7 text-xs justify-start px-2 font-normal border-dashed"
              onClick={() => {
                setSelectedEngineId(prev => prev === 'custom' ? null : 'custom');
                setEnhancedResult(null);
              }}
            >
              <Plus className="w-3 h-3 mr-1 text-muted-foreground" />
              기타 (직접 입력)
            </Button>
            {selectedEngineId === 'custom' && (
              <Input
                placeholder="모델/파라미터 직접 입력"
                value={customEngine}
                onChange={(e) => {
                  setCustomEngine(e.target.value);
                  setEnhancedResult(null);
                }}
                className="text-xs h-7 mt-1"
                autoFocus
              />
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Live Assembled Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            {enhancedResult ? 'AI 고품질 완성본' : '실시간 조합 프롬프트'}
          </Label>
          {currentRatioParam && (
            <span className="text-[11px] font-mono text-muted-foreground">
              {currentRatioParam}
            </span>
          )}
        </div>

        <div
          className="p-3 rounded-lg border border-border/40 bg-muted/30 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[120px] overflow-y-auto select-all"
          style={{ borderRadius: '8px' }}
        >
          {currentDisplayPrompt}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={handleDeepSeekEnhance}
            disabled={isEnhancing || !subject.trim()}
            className="flex-1 h-8 text-xs font-medium rounded-lg"
            style={{ borderRadius: '8px' }}
          >
            {isEnhancing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                AI 최적화 중...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                AI로 영문 시각 묘사 극대화
              </>
            )}
          </Button>

          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="h-8 text-xs px-3"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                복사
              </>
            )}
          </Button>

          {onApply && (
            <Button
              onClick={() => onApply(currentDisplayPrompt)}
              variant="secondary"
              size="sm"
              className="h-8 text-xs"
            >
              적용
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
