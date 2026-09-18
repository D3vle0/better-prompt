import React, { useState, useEffect } from 'react';
import { PromptAnalyzer } from '@/components/PromptAnalyzer';
import { ImagePromptStudio } from '@/components/ImagePromptStudio';
import { SettingsTab } from '@/components/SettingsTab';
import { HistoryTab } from '@/components/HistoryTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sparkles, Image as ImageIcon, History, Settings, X } from 'lucide-react';

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

  // Floating circular button positioning (bottom-right of active input box)
  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${Math.max(10, targetRect.bottom - 46)}px`,
    left: `${Math.max(10, targetRect.right - 46)}px`,
    zIndex: 2147483647,
  };

  // Expandable in-page popup positioning (bottom-right of viewport)
  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 2147483647,
  };

  return (
    <div className="better-prompt-container dark font-sans antialiased text-foreground">
      {/* 1. Floating AI Trigger Button (Explicitly Circular) */}
      {!isOpen && (
        <div style={buttonStyle} className="pointer-events-auto animate-fade-in">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-10 h-10 rounded-full !rounded-full shadow-lg border border-border bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer outline-none"
            style={{ borderRadius: '9999px' }}
            title="BetterPrompt"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 2. Expandable In-Page Popup (Exact same design and rounded radius as Extension Popup) */}
      {isOpen && (
        <div style={modalStyle} className="pointer-events-auto animate-fade-in">
          <div
            className="w-[480px] h-[580px] bg-background text-foreground flex flex-col font-sans select-none overflow-hidden border border-border rounded-xl shadow-2xl"
            style={{ borderRadius: '12px' }}
          >
            {/* Header - Clean, no subtitle text, no rectangular pills */}
            <header className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-card">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs"
                  style={{ borderRadius: '8px' }}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <h1 className="text-sm font-semibold tracking-tight">
                  BetterPrompt
                </h1>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                style={{ borderRadius: '6px' }}
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </header>

            {/* Main Tabs Navigation */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="px-3 pt-2 pb-1.5 border-b bg-muted/30 shrink-0">
                <TabsList className="grid grid-cols-4 w-full h-8">
                  <TabsTrigger value="analyzer" className="text-xs flex items-center gap-1 py-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    진단 & 교정
                  </TabsTrigger>
                  <TabsTrigger value="image" className="text-xs flex items-center gap-1 py-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    이미지 스튜디오
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs flex items-center gap-1 py-1">
                    <History className="w-3.5 h-3.5" />
                    히스토리
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="text-xs flex items-center gap-1 py-1">
                    <Settings className="w-3.5 h-3.5" />
                    설정
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4">
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

                <TabsContent value="history" className="m-0 focus-visible:outline-none">
                  <HistoryTab
                    onSelectPrompt={(text) => {
                      onApplyText(text);
                      setIsOpen(false);
                    }}
                  />
                </TabsContent>

                <TabsContent value="settings" className="m-0 focus-visible:outline-none">
                  <SettingsTab />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};
