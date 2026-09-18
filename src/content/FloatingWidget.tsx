import React, { useState, useEffect } from 'react';
import { PromptAnalyzer } from '@/components/PromptAnalyzer';
import { ImagePromptStudio } from '@/components/ImagePromptStudio';
import { SettingsTab } from '@/components/SettingsTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, Image as ImageIcon, Settings, X } from 'lucide-react';

interface FloatingWidgetProps {
  targetElement: HTMLElement | null;
  targetRect: DOMRect | null;
  initialText: string;
  onApplyText: (newText: string) => void;
  onClose: () => void;
}

export const FloatingWidget: React.FC<FloatingWidgetProps> = ({
  targetElement,
  targetRect,
  initialText,
  onApplyText,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('analyzer');
  const [currentText, setCurrentText] = useState(initialText);

  useEffect(() => {
    setCurrentText(initialText);
  }, [initialText]);

  if (!targetRect) return null;

  // Floating trigger button positioning:
  // Positioned at the bottom-right corner of the active input box
  const pillStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${Math.max(10, targetRect.bottom - 44)}px`,
    left: `${Math.max(10, targetRect.right - 46)}px`,
    zIndex: 2147483647,
  };

  // Expandable popup dialog positioning:
  // Fixed at bottom right of viewport with high elevation
  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '480px',
    maxHeight: '620px',
    zIndex: 2147483647,
  };

  return (
    <div className="better-prompt-container dark font-sans antialiased text-foreground">
      {/* 1. Grammarly-style Floating AI Badge Button */}
      {!isOpen && (
        <div style={pillStyle} className="pointer-events-auto animate-fade-in">
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-8 w-8 rounded-full shadow-lg border border-border hover:scale-105 active:scale-95 transition-all bg-primary text-primary-foreground"
            title="BetterPrompt: AI 프롬프트 진단 및 최적화"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 2. Expandable In-Page Doctor Card (Exact same shadcn/ui design as Extension Popup) */}
      {isOpen && (
        <div style={modalStyle} className="pointer-events-auto shadow-2xl animate-fade-in">
          <Card className="w-[480px] min-h-[560px] max-h-[620px] border bg-background text-foreground flex flex-col font-sans select-none overflow-hidden">
            {/* Header - Identical to Popup.tsx */}
            <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0 shrink-0 bg-card">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <CardTitle className="text-sm font-semibold tracking-tight">
                      BetterPrompt
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                      DeepSeek Flash
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Grammarly for AI Prompts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 hidden sm:inline-flex">
                  실시간 교정
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Main Tabs Navigation */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="px-3 pt-2 pb-1.5 border-b bg-muted/30">
                <TabsList className="grid grid-cols-3 w-full h-8">
                  <TabsTrigger value="analyzer" className="text-xs flex items-center gap-1 py-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    진단 & 교정
                  </TabsTrigger>
                  <TabsTrigger value="image" className="text-xs flex items-center gap-1 py-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    이미지 스튜디오
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="text-xs flex items-center gap-1 py-1">
                    <Settings className="w-3.5 h-3.5" />
                    설정
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <TabsContent value="analyzer" className="m-0 focus-visible:outline-none">
                  <PromptAnalyzer
                    initialPrompt={currentText}
                    onApplyToTarget={(enhancedText) => {
                      onApplyText(enhancedText);
                      setIsOpen(false);
                    }}
                    compact
                  />
                </TabsContent>

                <TabsContent value="image" className="m-0 focus-visible:outline-none">
                  <ImagePromptStudio
                    onApply={(prompt) => {
                      onApplyText(prompt);
                      setIsOpen(false);
                    }}
                  />
                </TabsContent>

                <TabsContent value="settings" className="m-0 focus-visible:outline-none">
                  <SettingsTab />
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>
      )}
    </div>
  );
};
