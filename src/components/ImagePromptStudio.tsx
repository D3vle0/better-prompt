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
  { label: '16:9 와이드', param: '--ar 16:9' },
  { label: '9:16 숏폼', param: '--ar 9:16' },
  { label: '1:1 정사각', param: '--ar 1:1' },
  { label: '4:5 인스타', param: '--ar 4:5' },
  { label: '21:9 시네마', param: '--ar 21:9' },
];

const ENGINES = [
  { id: 'mj', label: 'Midjourney v6.1', param: '--v 6.1 --stylize 250' },
  { id: 'flux', label: 'FLUX.1 Dev', param: '--quality 2' },
  { id: 'sdxl', label: 'SDXL', param: 'masterpiece, best quality' },
];

export const ImagePromptStudio: React.FC<{ onApply?: (text: string) => void }> = ({
  onApply,
}) => {
  const [subject, setSubject] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(ART_STYLES[0]);
  const [selectedLighting, setSelectedLighting] = useState(LIGHTINGS[0]);
  const [selectedCamera, setSelectedCamera] = useState(CAMERAS[0]);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [selectedEngine, setSelectedEngine] = useState(ENGINES[0]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const assembledPrompt = React.useMemo(() => {
    const parts: string[] = [];
    if (subject.trim()) {
      parts.push(subject.trim());
    } else {
      parts.push('[피사체 / 주제를 입력하세요]');
    }

    if (selectedStyle) parts.push(selectedStyle.value);
    if (selectedLighting) parts.push(selectedLighting.value);
    if (selectedCamera) parts.push(selectedCamera.value);
    if (selectedEngine) parts.push(selectedEngine.param);
    if (selectedRatio) parts.push(selectedRatio.param);

    return parts.join(', ');
  }, [subject, selectedStyle, selectedLighting, selectedCamera, selectedEngine, selectedRatio]);

  const handleDeepSeekEnhance = async () => {
    if (!subject.trim()) return;
    setIsEnhancing(true);

    try {
      const promptQuery = `${subject}, ${selectedStyle.label}, ${selectedLighting.label}, ${selectedCamera.label}, 종횡비 ${selectedRatio.label}, 엔진 ${selectedEngine.label}`;
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

      {/* Style Presets Grid */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Palette className="w-3.5 h-3.5" />
          화풍 및 아트 스타일
        </Label>
        <div className="grid grid-cols-3 gap-1.5">
          {ART_STYLES.map((style) => (
            <Button
              key={style.id}
              type="button"
              variant={selectedStyle.id === style.id ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs justify-start px-2.5 font-normal"
              onClick={() => {
                setSelectedStyle(style);
                setEnhancedResult(null);
              }}
            >
              {style.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Lighting & Camera */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sun className="w-3.5 h-3.5" />
            조명 및 무드
          </Label>
          <div className="space-y-1">
            {LIGHTINGS.map((light) => (
              <Button
                key={light.id}
                type="button"
                variant={selectedLighting.id === light.id ? "default" : "outline"}
                size="sm"
                className="w-full h-7 text-xs justify-start px-2 font-normal"
                onClick={() => {
                  setSelectedLighting(light);
                  setEnhancedResult(null);
                }}
              >
                {light.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Camera className="w-3.5 h-3.5" />
            카메라 및 앵글
          </Label>
          <div className="space-y-1">
            {CAMERAS.map((cam) => (
              <Button
                key={cam.id}
                type="button"
                variant={selectedCamera.id === cam.id ? "default" : "outline"}
                size="sm"
                className="w-full h-7 text-xs justify-start px-2 font-normal"
                onClick={() => {
                  setSelectedCamera(cam);
                  setEnhancedResult(null);
                }}
              >
                {cam.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Aspect Ratio & Engine */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Ratio className="w-3.5 h-3.5" />
            종횡비 (Aspect Ratio)
          </Label>
          <div className="space-y-1">
            {ASPECT_RATIOS.slice(0, 3).map((r, i) => (
              <Button
                key={i}
                type="button"
                variant={selectedRatio.param === r.param ? "default" : "outline"}
                size="sm"
                className="w-full h-7 text-xs justify-start px-2 font-normal"
                onClick={() => {
                  setSelectedRatio(r);
                  setEnhancedResult(null);
                }}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>

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
                variant={selectedEngine.id === eng.id ? "default" : "outline"}
                size="sm"
                className="w-full h-7 text-xs justify-start px-2 font-normal"
                onClick={() => {
                  setSelectedEngine(eng);
                  setEnhancedResult(null);
                }}
              >
                {eng.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Live Assembled Output - Clean flat container without nested card */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            {enhancedResult ? 'AI 고품질 완성본' : '실시간 조합 프롬프트'}
          </Label>
          <span className="text-[11px] font-mono text-muted-foreground">
            {selectedRatio.param}
          </span>
        </div>

        <div className="p-3 rounded-lg border border-border/40 bg-muted/30 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[120px] overflow-y-auto select-all" style={{ borderRadius: '8px' }}>
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
