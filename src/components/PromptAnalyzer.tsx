import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PromptQualityGauge } from './PromptQualityGauge';
import { PromptAnalysisResult, EnhancedOption } from '@/types';
import { analyzePromptWithAI } from '@/services/aiService';
import { addHistoryItem } from '@/services/storage';
import {
  Sparkles,
  Copy,
  Check,
  ArrowRightLeft,
  AlertCircle,
  Lightbulb,
  CornerDownLeft,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PromptAnalyzerProps {
  initialPrompt?: string;
  onApplyToTarget?: (text: string) => void;
  compact?: boolean;
}

const SAMPLE_PROMPTS = [
  { label: '사이버펑크 서울', text: '사이버펑크 느낌의 서울 비오는 밤거리 하나 그려줘' },
  { label: '리액트 커스텀 훅', text: '리액트 성능 최적화하는 훅 코드 짜줘' },
  { label: '마케팅 카피', text: '신규 AI 서비스 런칭 인스타그램 광고 카피 작성해줘' },
  { label: '데이터 분석', text: '고객 이탈률 분석하고 대책 세워줘' },
];

export const PromptAnalyzer: React.FC<PromptAnalyzerProps> = ({
  initialPrompt = '',
  onApplyToTarget,
  compact = false,
}) => {
  const [promptInput, setPromptInput] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PromptAnalysisResult | null>(null);
  const [activeOptionTab, setActiveOptionTab] = useState<'quick' | 'expert' | 'engine'>('engine');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showAllWeaknesses, setShowAllWeaknesses] = useState(false);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const targetText = textToAnalyze !== undefined ? textToAnalyze : promptInput;
    if (!targetText.trim()) return;

    setIsLoading(true);
    setApplied(false);

    try {
      const data = await analyzePromptWithAI(targetText);
      setResult(data);
      if (data.category === 'image') {
        setActiveOptionTab('engine');
      } else {
        setActiveOptionTab('expert');
      }

      await addHistoryItem({
        originalPrompt: data.originalPrompt,
        category: data.category,
        qualityScore: data.qualityScore,
        enhancedPrompt: data.options[data.category === 'image' ? 'engine' : 'expert'].prompt,
        enhancedMode: data.category === 'image' ? 'engine' : 'expert',
      });
    } catch (err: any) {
      console.error('Analysis error:', err);
      alert(`분석 실패: ${err.message || '다시 시도해주세요'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (text: string) => {
    if (onApplyToTarget) {
      onApplyToTarget(text);
      setApplied(true);
      setTimeout(() => setApplied(false), 2500);
    } else {
      handleCopy(text, 'apply_copy');
    }
  };

  const handleSampleClick = (text: string) => {
    setPromptInput(text);
    handleAnalyze(text);
  };

  const currentOption: EnhancedOption | undefined = result?.options[activeOptionTab];

  return (
    <div className="flex flex-col space-y-4">
      {/* Input Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5" />
            분석할 프롬프트 입력
          </Label>
          <span className="text-[11px] text-muted-foreground font-mono">
            {promptInput.length} chars
          </span>
        </div>

        <Textarea
          placeholder="AI에게 요청할 원본 프롬프트를 입력하세요... (예: 사이버펑크 고양이 일러스트 그려줘)"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          className="min-h-[85px] text-sm resize-y rounded-lg"
          style={{ borderRadius: '8px' }}
        />

        {/* Preset Sample Links - Clean text, no rectangular pills */}
        {!result && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground">예시:</span>
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer bg-transparent border-0 p-0 transition-colors"
                onClick={() => handleSampleClick(sample.text)}
              >
                {sample.label}
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={() => handleAnalyze()}
          disabled={isLoading || !promptInput.trim()}
          className="w-full h-9 text-xs font-medium rounded-lg"
          style={{ borderRadius: '8px' }}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
              분석 중...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              프롬프트 정밀 진단 및 3단계 최적화
            </>
          )}
        </Button>
      </div>

      {/* Analysis Result - Clean flat layout without rectangular pill badges or nested cards */}
      {result && (
        <div className="space-y-4 pt-1">
          <Separator />

          {/* Quality Header & 1-Line Diagnosis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <PromptQualityGauge score={result.qualityScore} size="md" />
              <span className="text-xs text-muted-foreground font-medium">
                {result.categoryLabel}
              </span>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 text-xs" style={{ borderRadius: '8px' }}>
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-foreground leading-relaxed font-medium">
                {result.summaryDiagnosis}
              </span>
            </div>

            {/* Weaknesses List */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  발견된 취약점 ({result.weaknesses.length}개)
                </span>
                {result.weaknesses.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllWeaknesses(!showAllWeaknesses)}
                    className="h-6 text-[11px] px-1.5 text-muted-foreground font-normal rounded-md"
                    style={{ borderRadius: '6px' }}
                  >
                    {showAllWeaknesses ? '접기' : '더보기'}
                    {showAllWeaknesses ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                {(showAllWeaknesses ? result.weaknesses : result.weaknesses.slice(0, 2)).map((w) => (
                  <div
                    key={w.id}
                    className="p-2 text-xs space-y-0.5 rounded-lg bg-muted/20"
                    style={{ borderRadius: '8px' }}
                  >
                    <div className="flex items-center justify-between font-medium text-foreground">
                      <span>• {w.title}</span>
                      <span className="text-[10px] uppercase font-mono text-muted-foreground">
                        {w.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal pl-2.5">
                      {w.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* 3 Enhanced Recommendations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                추천 프롬프트
              </span>

              <Button
                type="button"
                variant={showDiff ? "secondary" : "outline"}
                size="sm"
                className="h-7 text-[11px] px-2.5 font-normal"
                onClick={() => setShowDiff(!showDiff)}
              >
                <ArrowRightLeft className="w-3 h-3 mr-1" />
                원문과 비교
              </Button>
            </div>

            <Tabs
              value={activeOptionTab}
              onValueChange={(val) => setActiveOptionTab(val as any)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full h-8">
                <TabsTrigger value="quick" className="text-xs">
                  빠른 보정
                </TabsTrigger>
                <TabsTrigger value="expert" className="text-xs">
                  전문가 구조화
                </TabsTrigger>
                <TabsTrigger value="engine" className="text-xs">
                  {result.category === 'image' ? 'Midjourney/FLUX' : '심층 추론'}
                </TabsTrigger>
              </TabsList>

              {currentOption && (
                <div className="mt-3 space-y-3">
                  <div>
                    <span className="text-xs font-semibold">
                      {currentOption.title}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {currentOption.description}
                    </p>
                  </div>

                  {/* Prompt Box or Diff View */}
                  {showDiff ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-muted/40 space-y-1" style={{ borderRadius: '8px' }}>
                        <span className="text-[10px] font-bold text-muted-foreground">원문 (Before)</span>
                        <p className="text-muted-foreground whitespace-pre-wrap text-[11px]">
                          {result.originalPrompt}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/60 space-y-1" style={{ borderRadius: '8px' }}>
                        <span className="text-[10px] font-bold text-foreground">교정본 (After)</span>
                        <p className="text-foreground whitespace-pre-wrap font-medium text-[11px]">
                          {currentOption.prompt}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="p-3 rounded-lg border border-border/40 bg-muted/30 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[190px] overflow-y-auto select-all"
                      style={{ borderRadius: '8px' }}
                    >
                      {currentOption.prompt}
                    </div>
                  )}

                  {/* Engine Parameters - Clean typography without rectangular pills */}
                  {currentOption.parameters && Object.keys(currentOption.parameters).length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                      <span className="text-[11px] font-medium">
                        파라미터:
                      </span>
                      {Object.entries(currentOption.parameters).map(([k, v]) => (
                        <span key={k} className="font-mono text-[11px] text-foreground font-medium">
                          {v}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Why this works */}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground pt-0.5">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-foreground" />
                    <div className="space-y-0.5 leading-normal">
                      <span className="font-medium text-foreground text-[11px]">교정 가이드: </span>
                      <span className="text-[11px]">{currentOption.whyItWorks}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      onClick={() => handleApply(currentOption.prompt)}
                      className="flex-1 h-8.5 text-xs font-medium rounded-lg"
                      style={{ borderRadius: '8px' }}
                    >
                      {applied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          {onApplyToTarget ? '입력창에 대체됨' : '복사 완료'}
                        </>
                      ) : (
                        <>
                          <CornerDownLeft className="w-3.5 h-3.5 mr-1.5" />
                          {onApplyToTarget ? '입력창에 대체하기' : '프롬프트 적용하기'}
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => handleCopy(currentOption.prompt, currentOption.id)}
                      variant="outline"
                      className="h-8.5 text-xs px-3 font-normal rounded-lg"
                      style={{ borderRadius: '8px' }}
                    >
                      {copiedId === currentOption.id ? (
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
                  </div>
                </div>
              )}
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};
