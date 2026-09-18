import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PromptAnalyzer } from '@/components/PromptAnalyzer';
import { ImagePromptStudio } from '@/components/ImagePromptStudio';
import { HistoryTab } from '@/components/HistoryTab';
import { SettingsTab } from '@/components/SettingsTab';
import { Button } from '@/components/ui/button';
import { getSettings, isSiteAllowed, addAllowedSite } from '@/services/storage';
import {
  Sparkles,
  Image as ImageIcon,
  History,
  Settings,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState('analyzer');
  const [currentHostname, setCurrentHostname] = useState<string>('');
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    async function checkCurrentTab() {
      let hostname = '';

      if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const tab = tabs[0];
          if (tab?.url) {
            try {
              const urlObj = new URL(tab.url);
              // Only consider standard web URLs (http/https)
              if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
                hostname = urlObj.hostname;
              }
            } catch {}
          }
        } catch (e) {
          console.warn('Failed to query active tab', e);
        }
      } else {
        // Fallback for standalone demo
        hostname = window.location.hostname;
      }

      setCurrentHostname(hostname);

      // If browser internal page (chrome://, about:, extensions, etc.), allow tools directly
      if (!hostname) {
        setIsAllowed(true);
        return;
      }

      try {
        const settings = await getSettings();
        const allowed = isSiteAllowed(hostname, settings.allowedSites);
        setIsAllowed(allowed);
      } catch (err) {
        console.warn('Failed to read settings in popup', err);
        setIsAllowed(true);
      }
    }

    checkCurrentTab();
  }, []);

  const handleActivateSite = async () => {
    if (!currentHostname) return;
    setIsActivating(true);
    try {
      await addAllowedSite(currentHostname);
      setIsAllowed(true);

      // Notify content script in current active tab
      if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const tabId = tabs[0]?.id;
          if (tabId) {
            chrome.tabs.sendMessage(tabId, {
              type: 'BETTER_PROMPT_SITE_ALLOWED',
              domain: currentHostname,
            });
          }
        } catch {}
      }
    } catch (e) {
      console.error('Failed to activate site:', e);
      setIsAllowed(true);
    } finally {
      setIsActivating(false);
    }
  };

  // Loading state while checking active tab and permissions
  if (isAllowed === null) {
    return (
      <div
        className="w-[480px] h-[580px] bg-background text-foreground flex items-center justify-center font-sans border border-border rounded-xl"
        style={{ borderRadius: '12px' }}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span className="text-xs">사이트 환경 확인 중...</span>
        </div>
      </div>
    );
  }

  // Not allowed yet and user hasn't bypassed: Show activation confirmation screen
  if (!isAllowed && !isBypassed) {
    return (
      <div
        className="w-[480px] h-[580px] bg-background text-foreground flex flex-col font-sans select-none overflow-hidden border border-border rounded-xl"
        style={{ borderRadius: '12px' }}
      >
        {/* Top Header */}
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

        {/* Activation Hero Container */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5">
          <div className="space-y-2.5">
            <h2 className="text-lg font-bold tracking-tight text-foreground leading-snug">
              이 사이트에서 BetterPrompt를<br />활성화하시겠습니까?
            </h2>

            {currentHostname && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs font-mono font-medium text-foreground">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                {currentHostname}
              </div>
            )}
          </div>

          <div className="w-full p-3.5 rounded-lg border border-border/40 bg-muted/30 text-xs text-muted-foreground space-y-2 text-left leading-relaxed">
            <div className="flex items-start gap-2 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
              <span>이 사이트의 프롬프트 및 텍스트 입력창을 실시간 감지하여 AI 보정 플로팅 버튼을 제공합니다.</span>
            </div>
            <div className="flex items-start gap-2 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
              <span>승인된 사이트는 브라우저에 안전하게 기억되어 다음 방문 시 자동으로 연동됩니다.</span>
            </div>
            <div className="flex items-start gap-2 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
              <span>활성화하기 전까지는 웹페이지 내에 어떠한 버튼이나 스크립트도 노출되지 않습니다.</span>
            </div>
          </div>

          <div className="w-full space-y-2 pt-1">
            <Button
              onClick={handleActivateSite}
              disabled={isActivating}
              className="w-full h-10 text-xs font-semibold rounded-lg gap-2 shadow-sm"
              style={{ borderRadius: '8px' }}
            >
              <Sparkles className="w-4 h-4" />
              {isActivating ? '활성화 중...' : '이 사이트에서 활성화하기 (확인)'}
            </Button>

            <Button
              onClick={() => setIsBypassed(true)}
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              페이지 연동 없이 팝업 도구만 사용하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Normal Authorized Prompting Tools Interface
  return (
    <div
      className="w-[480px] h-[580px] bg-background text-foreground flex flex-col font-sans select-none overflow-hidden border border-border rounded-xl"
      style={{ borderRadius: '12px' }}
    >
      {/* Top Header */}
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
          <TabsList className="grid grid-cols-4 w-full h-9">
            <TabsTrigger value="analyzer" className="text-xs flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              진단 & 교정
            </TabsTrigger>
            <TabsTrigger value="image" className="text-xs flex items-center justify-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              이미지 스튜디오
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs flex items-center justify-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              히스토리
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs flex items-center justify-center gap-1.5">
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
