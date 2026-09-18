import React, { useState, useEffect } from 'react';
import { PromptAnalyzer } from '@/components/PromptAnalyzer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, X } from 'lucide-react';

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
  const [currentText, setCurrentText] = useState(initialText);

  useEffect(() => {
    setCurrentText(initialText);
  }, [initialText]);

  if (!targetRect) return null;

  const pillStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${Math.max(10, targetRect.bottom - 42)}px`,
    left: `${Math.max(10, targetRect.right - 44)}px`,
    zIndex: 2147483647,
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '450px',
    maxHeight: '620px',
    zIndex: 2147483647,
  };

  return (
    <div className="better-prompt-container dark font-sans antialiased">
      {/* 1. Grammarly-style Floating Button */}
      {!isOpen && (
        <div style={pillStyle} className="pointer-events-auto">
          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-8 w-8 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
            title="BetterPrompt: AI 프롬프트 진단 및 교정"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 2. Expandable In-Page Doctor Card */}
      {isOpen && (
        <div style={modalStyle} className="pointer-events-auto shadow-2xl">
          <Card className="border shadow-lg flex flex-col overflow-hidden bg-background">
            <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <CardTitle className="text-xs font-semibold">
                  BetterPrompt Doctor
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  DeepSeek Flash
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>

            <CardContent className="p-3.5 overflow-y-auto max-h-[520px]">
              <PromptAnalyzer
                initialPrompt={currentText}
                onApplyToTarget={(enhancedText) => {
                  onApplyText(enhancedText);
                  setIsOpen(false);
                }}
                compact
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
