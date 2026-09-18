import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
          className="min-h-[85px] text-sm resize-y"
        />

        {/* Preset Sample Buttons */}
        {!result && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-muted-foreground">예시:</span>
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <Button
                key={idx}
                type="button"
                variant="outline"
                size="sm"
                className="h-6 text-[11px] px-2"
                onClick={() => handleSampleClick(sample.text)}
              >
                {sample.label}
              </Button>
            ))}
          </div>
        )}

        <Button
          onClick={() => handleAnalyze()}
          disabled={isLoading || !promptInput.trim()}
          className="w-full h-9 text-xs font-medium"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
              DeepSeek V4.1 Flash 분석 중...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              프롬프트 정밀 진단 및 3단계 최적화
            </>
          )}
        </Button>
      </div>

      {/* Analysis Result Card */}
      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <PromptQualityGauge score={result.qualityScore} size="md" />
                <Badge variant="outline" className="text-xs">
                  {result.categoryLabel}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
              {/* 1-Line Diagnosis */}
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/60 border text-xs">
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
                      className="h-6 text-[11px] px-1.5 text-muted-foreground"
                    >
                      {showAllWeaknesses ? '접기' : '더보기'}
                      {showAllWeaknesses ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                    </Button>
                  )}
                </div>

                <div className="space-y-1">
                  {(showAllWeaknesses ? result.weaknesses : result.weaknesses.slice(0, 2)).map((w) => (
                    <div
                      key={w.id}
                      className="p-2.5 rounded-md border bg-card text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between font-medium text-foreground">
                        <span>• {w.title}</span>
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                          {w.severity}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                        {w.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3 Enhanced Recommendations Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                추천 프롬프트 선택
              </span>

              <Button
                type="button"
                variant={showDiff ? "secondary" : "outline"}
                size="sm"
                className="h-7 text-[11px] px-2.5"
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
              <TabsList className="grid grid-cols-3 w-full">
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
                <Card className="mt-2.5">
                  <CardHeader className="p-3.5 pb-2 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CardTitle className="text-xs font-semibold">
                            {currentOption.title}
                          </CardTitle>
                          <Badge variant="secondary" className="text-[10px]">
                            {currentOption.tag}
                          </Badge>
                        </div>
                        <CardDescription className="text-[11px] mt-0.5">
                          {currentOption.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3.5 space-y-3">
                    {/* Prompt Content or Diff View */}
                    {showDiff ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-md border bg-muted/40 space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground">원문 (Before)</span>
                          <p className="text-muted-foreground whitespace-pre-wrap text-[11px]">
                            {result.originalPrompt}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-md border bg-card space-y-1">
                          <span className="text-[10px] font-bold text-foreground">교정본 (After)</span>
                          <p className="text-foreground whitespace-pre-wrap font-medium text-[11px]">
                            {currentOption.prompt}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <ScrollArea className="max-h-[180px] rounded-md border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground">
                        {currentOption.prompt}
                      </ScrollArea>
                    )}

                    {/* Parameters */}
                    {currentOption.parameters && Object.keys(currentOption.parameters).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          엔진 파라미터:
                        </span>
                        {Object.entries(currentOption.parameters).map(([k, v]) => (
                          <Badge key={k} variant="outline" className="font-mono text-[10px]">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Why This Works (Educational Guide) */}
                    <div className="p-2.5 rounded-md border bg-muted/20 text-xs flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-semibold text-foreground text-[11px]">
                          교정 원리 & 가이드 (Why this works)
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                          {currentOption.whyItWorks}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        onClick={() => handleApply(currentOption.prompt)}
                        className="flex-1 h-8.5 text-xs"
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
                        className="h-8.5 text-xs px-3"
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
                  </CardContent>
                </Card>
              )}
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};
