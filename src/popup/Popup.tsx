import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PromptAnalyzer } from '@/components/PromptAnalyzer';
import { ImagePromptStudio } from '@/components/ImagePromptStudio';
import { HistoryTab } from '@/components/HistoryTab';
import { SettingsTab } from '@/components/SettingsTab';
import { Sparkles, Image as ImageIcon, History, Settings } from 'lucide-react';

export const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState('analyzer');

  return (
    <div
      className="w-[480px] h-[580px] bg-background text-foreground flex flex-col font-sans select-none overflow-hidden border border-border rounded-xl"
      style={{ borderRadius: '12px' }}
    >
      {/* Top Header - Clean, no subtitle text, no rectangular pills */}
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
      </header>

      {/* Main Tab Navigation */}
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

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="analyzer" className="m-0 focus-visible:outline-none">
            <PromptAnalyzer />
          </TabsContent>

          <TabsContent value="image" className="m-0 focus-visible:outline-none">
            <ImagePromptStudio />
          </TabsContent>

          <TabsContent value="history" className="m-0 focus-visible:outline-none">
            <HistoryTab />
          </TabsContent>

          <TabsContent value="settings" className="m-0 focus-visible:outline-none">
            <SettingsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
