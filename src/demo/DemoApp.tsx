import React, { useState, useRef } from 'react';
import { Popup } from '@/popup/Popup';
import { FloatingWidget } from '@/content/FloatingWidget';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  Bot,
  Send,
  Sliders,
  CheckCircle2,
  Laptop,
  Smartphone,
  AlertCircle,
} from 'lucide-react';

const TEST_PRESETS = [
  {
    title: '이미지 생성 (초급)',
    prompt: '사이버펑크 느낌의 서울 비오는 밤거리 하나 그려줘',
    tip: '화풍, 카메라 렌즈, 조명, Midjourney 파라미터가 결여된 대표적 사례',
  },
  {
    title: '프론트엔드 코딩 (초급)',
    prompt: '리액트 컴포넌트 성능 최적화하는 커스텀 훅 코드 작성해줘',
    tip: '제약사항, 대상 상태, 예시 코드 요구가 없는 단편적 요청',
  },
  {
    title: '마케팅 카피 (초급)',
    prompt: '신규 AI 도구 런칭할건데 인스타 광고 문구 써줘',
    tip: '타겟 오디언스, 브랜드 톤앤매너, CTA, 글자수 제약 미지정',
  },
];

export const DemoApp: React.FC = () => {
  const [viewMode, setViewMode] = useState<'simulator' | 'popup'>('simulator');
  const [simulatedPrompt, setSimulatedPrompt] = useState(TEST_PRESETS[0].prompt);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: '안녕하세요! 무엇이든 물어보시거나 만들고 싶은 이미지를 말씀해주세요.',
    },
  ]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaRect, setTextareaRect] = useState<DOMRect | null>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      setTextareaRect(textareaRef.current.getBoundingClientRect());
    }
  }, [simulatedPrompt, viewMode]);

  React.useEffect(() => {
    const handleUpdate = () => {
      if (textareaRef.current) {
        setTextareaRect(textareaRef.current.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, []);

  const handleSendPrompt = () => {
    if (!simulatedPrompt.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text: simulatedPrompt },
      {
        role: 'assistant',
        text: `"${simulatedPrompt.slice(0, 45)}..." 프롬프트에 대한 고품질 생성 결과를 산출합니다. (BetterPrompt로 정밀 보정된 프롬프트는 3배 이상의 품질 향상을 보입니다!)`,
      },
    ]);
    setSimulatedPrompt('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight">
                BetterPrompt
              </h1>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                shadcn/ui
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                DeepSeek V4.1 Flash
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Grammarly for AI Prompts • 실시간 브라우저 프롬프트 진단 & 교정
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-md">
          <Button
            type="button"
            variant={viewMode === 'simulator' ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs font-normal"
            onClick={() => setViewMode('simulator')}
          >
            <Laptop className="w-3.5 h-3.5 mr-1" />
            웹페이지 시뮬레이터
          </Button>
          <Button
            type="button"
            variant={viewMode === 'popup' ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs font-normal"
            onClick={() => setViewMode('popup')}
          >
            <Smartphone className="w-3.5 h-3.5 mr-1" />
            익스텐션 팝업 뷰
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {viewMode === 'simulator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Test Scenarios */}
            <div className="lg:col-span-4 space-y-4">
              <Card>
                <CardHeader className="p-4 pb-3">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                    시연 시나리오 선택
                  </CardTitle>
                  <CardDescription className="text-xs">
                    주변 지인들이 흔히 겪는 초급 프롬프트를 클릭해보세요.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-2">
                  {TEST_PRESETS.map((preset, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant={simulatedPrompt === preset.prompt ? "secondary" : "outline"}
                      className="w-full h-auto p-3 flex flex-col items-start text-left justify-start whitespace-normal"
                      onClick={() => {
                        setSimulatedPrompt(preset.prompt);
                        setTimeout(() => {
                          if (textareaRef.current) {
                            textareaRef.current.focus();
                            setTextareaRect(textareaRef.current.getBoundingClientRect());
                          }
                        }, 50);
                      }}
                    >
                      <div className="w-full flex items-center justify-between text-xs font-medium">
                        <span>{preset.title}</span>
                        <Badge variant="outline" className="text-[10px] font-normal">
                          선택
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        "{preset.prompt}"
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {preset.tip}
                      </p>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Architecture Info Card */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    BetterPrompt 구조
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
                    <span><strong>shadcn/ui 순수 컴포넌트</strong>: Card, Button, Badge, Tabs, Input, Select, ScrollArea 기반</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
                    <span><strong>Shadow DOM 격리</strong>: 대상 사이트 CSS 간섭 차단</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
                    <span><strong>Background API 중계</strong>: 브라우저 CSP / CORS 완벽 우회</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
                    <span><strong>DeepSeek V4.1 Flash</strong>: 초저지연 프롬프트 품질 진단 및 3단계 최적화</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Simulated ChatGPT Interface */}
            <div className="lg:col-span-8 relative">
              <Card className="flex flex-col h-[650px] overflow-hidden">
                <CardHeader className="px-4 py-2.5 bg-muted/40 border-b flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-border" />
                      <div className="w-2.5 h-2.5 rounded-full bg-border" />
                      <div className="w-2.5 h-2.5 rounded-full bg-border" />
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 font-mono">
                      https://chatgpt.com (가상 AI 웹페이지 시뮬레이션)
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Content Script Active
                  </Badge>
                </CardHeader>

                {/* Simulated Chat Messages */}
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-3 max-w-[85%] ${
                          msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground font-bold text-xs'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {msg.role === 'user' ? '나' : <Bot className="w-4 h-4" />}
                        </div>
                        <div
                          className={`p-3 rounded-lg text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted/50 text-foreground border whitespace-pre-wrap'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Simulated Prompt Input Box with Attached Floating Widget */}
                <CardFooter className="p-4 border-t bg-card/50 flex flex-col items-stretch space-y-2">
                  <div className="relative w-full">
                    <textarea
                      ref={textareaRef}
                      value={simulatedPrompt}
                      onChange={(e) => setSimulatedPrompt(e.target.value)}
                      onFocus={() => {
                        if (textareaRef.current) {
                          setTextareaRect(textareaRef.current.getBoundingClientRect());
                        }
                      }}
                      placeholder="메시지를 입력하세요... (BetterPrompt가 실시간으로 감지합니다)"
                      className="w-full min-h-[90px] p-3 pr-12 text-sm rounded-md border border-input bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    />

                    <Button
                      type="button"
                      size="icon"
                      disabled={!simulatedPrompt.trim()}
                      onClick={handleSendPrompt}
                      className="absolute right-2.5 bottom-2.5 h-8 w-8"
                      title="전송"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>💡 입력창 우측 하단의 뱃지를 누르면 Grammarly처럼 정밀 교정창이 열립니다.</span>
                    <span className="font-mono">Enter / 전송</span>
                  </div>
                </CardFooter>
              </Card>

              {/* Floating Grammarly Widget mounted over simulated textarea */}
              {textareaRect && (
                <FloatingWidget
                  targetElement={textareaRef.current}
                  targetRect={textareaRect}
                  initialText={simulatedPrompt}
                  onApplyText={(newText) => {
                    setSimulatedPrompt(newText);
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }}
                  onClose={() => {}}
                />
              )}
            </div>
          </div>
        ) : (
          /* Popup Preview Mode */
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-base font-semibold">
                Chrome 툴바 확장 프로그램 팝업 (Popup View)
              </h2>
              <p className="text-xs text-muted-foreground">
                브라우저 우측 상단의 익스텐션 아이콘을 클릭했을 때 나타나는 독립 대시보드입니다.
              </p>
            </div>

            <div className="rounded-lg shadow-xl overflow-hidden">
              <Popup />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 px-6 text-center text-xs text-muted-foreground bg-card">
        BetterPrompt — Grammarly for AI Prompts • Built with shadcn/ui and OpenCode Go DeepSeek V4.1 Flash
      </footer>
    </div>
  );
};
