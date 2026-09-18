import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AppSettings } from '@/types';
import { getSettings, saveSettings, removeAllowedSite, DEFAULT_ALLOWED_SITES, BACKEND_SERVER_URL } from '@/services/storage';
import {
  Globe,
  Brain,
  X,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    backendUrl: BACKEND_SERVER_URL,
    floatingBadgeEnabled: true,
    preferredLanguage: 'ko',
    deepThinkingEnabled: false,
    allowedSites: DEFAULT_ALLOWED_SITES,
    isDockerProduction: true,
  });

  const [_saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
    });
  }, []);

  const handleChange = (key: keyof AppSettings, value: any) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
    setSaveStatus('저장됨');
    setTimeout(() => setSaveStatus(null), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3.5">
        {/* Floating Badge Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold">
              웹페이지 플로팅 버튼 표시
            </Label>
            <p className="text-[11px] text-muted-foreground">
              ChatGPT, Gemini 입력창 우측 하단에 AI 교정 버튼 표시
            </p>
          </div>
          <Switch
            checked={settings.floatingBadgeEnabled}
            onCheckedChange={(checked) =>
              handleChange('floatingBadgeEnabled', checked)
            }
          />
        </div>

        <Separator />

        {/* Deep Thinking Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-foreground" />
              <Label className="text-xs font-semibold">
                심층 추론 모드 (Deep Thinking)
              </Label>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {settings.deepThinkingEnabled
                ? 'ON: 모델이 다단계 추론을 거쳐 최고 품질의 프롬프트를 설계합니다. (약 15~20초)'
                : 'OFF: 1~2초 내 즉각 응답하는 초고속 모드로 작동합니다.'}
            </p>
          </div>
          <Switch
            checked={settings.deepThinkingEnabled}
            onCheckedChange={(checked) =>
              handleChange('deepThinkingEnabled', checked)
            }
          />
        </div>

        <Separator />

        {/* Preferred Language */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold">
              기본 추천 언어
            </Label>
            <p className="text-[11px] text-muted-foreground">
              프롬프트 보정 및 분석 결과 출력 언어
            </p>
          </div>
          <div className="flex items-center rounded-lg border border-border/60 p-0.5 bg-muted/40 shrink-0">
            <button
              type="button"
              onClick={() => handleChange('preferredLanguage', 'ko')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer select-none ${
                (settings.preferredLanguage || 'ko') === 'ko'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              한국어
            </button>
            <button
              type="button"
              onClick={() => handleChange('preferredLanguage', 'en')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer select-none ${
                settings.preferredLanguage === 'en'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              영어
            </button>
          </div>
        </div>

        <Separator />

        {/* Allowed Sites Management */}
        <div className="space-y-2.5">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-foreground" />
              활성화된 사이트 관리
            </Label>
            <p className="text-[11px] text-muted-foreground">
              BetterPrompt 연동을 허용하고 브라우저가 기억하고 있는 사이트 목록
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-border/40 bg-muted/20 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {(settings.allowedSites || DEFAULT_ALLOWED_SITES).length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">
                  활성화된 사이트가 없습니다.
                </p>
              ) : (
                (settings.allowedSites || DEFAULT_ALLOWED_SITES).map((site) => (
                  <button
                    key={site}
                    type="button"
                    onClick={async () => {
                      const updated = await removeAllowedSite(site);
                      setSettings((prev) => ({ ...prev, allowedSites: updated }));
                    }}
                    className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs font-mono border border-border/50 text-foreground hover:bg-destructive/15 hover:border-destructive/40 hover:text-destructive transition-all cursor-pointer select-none"
                    title="클릭 시 활성화 목록에서 삭제"
                  >
                    <span>{site}</span>
                    <X className="w-3 h-3 text-muted-foreground group-hover:text-destructive transition-colors" />
                  </button>
                ))
              )}
            </div>
            <p className="text-[10px] text-muted-foreground pt-0.5">
              * 도메인을 클릭하면 활성화 목록에서 즉시 삭제됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
