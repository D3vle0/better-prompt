import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AppSettings } from '@/types';
import { getSettings, saveSettings } from '@/services/storage';
import { testBackendConnection } from '@/services/aiService';
import {
  Server,
  Globe,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  ShieldCheck,
  RotateCcw,
  Brain,
  Check,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    backendUrl: 'http://localhost:3001',
    floatingBadgeEnabled: true,
    preferredLanguage: 'ko',
    defaultImageEngine: 'midjourney',
    deepThinkingEnabled: false,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    model?: string;
    uptime?: number;
  } | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      // Auto ping test on mount to show server health
      testBackendConnection(s.backendUrl).then(setTestResult);
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

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const res = await testBackendConnection(settings.backendUrl);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleResetDefaultUrl = () => {
    handleChange('backendUrl', 'http://localhost:3001');
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="space-y-1">
        <h3 className="text-xs font-semibold flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5" />
          AI 백엔드 서버 연동
        </h3>
        <p className="text-[11px] text-muted-foreground">
          별도의 API 키 없이 운영자가 호스팅하는 AI 백엔드를 통해 실시간 분석 및 교정을 제공합니다.
        </p>
      </div>

      <Separator />

      {/* Security & Keyless Notice */}
      <div className="p-3 rounded-lg border bg-muted/30 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs">
          <p className="font-medium text-[11px]">사용자 API 키 설정 불필요 (Keyless)</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            모든 AI 모델 추론 및 프롬프트 분석은 백엔드 서버에서 안전하게 처리됩니다. 익스텐션에서 API 키를 입력하거나 노출할 필요가 없습니다.
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <div className="space-y-3.5">
        {/* Backend URL */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="backend-url" className="text-xs flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              백엔드 서버 URL
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetDefaultUrl}
              className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              로컬 기본값
            </Button>
          </div>

          <Input
            id="backend-url"
            type="text"
            placeholder="http://localhost:3001"
            value={settings.backendUrl}
            onChange={(e) => handleChange('backendUrl', e.target.value)}
            className="font-mono text-xs h-8"
          />
          <p className="text-[10px] text-muted-foreground">
            * 배포된 백엔드 서버 URL(예: https://api.betterprompt.dev)로 변경할 수 있습니다.
          </p>
        </div>

        {/* Connection Test & Health Status */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isTesting}
            onClick={handleTestConnection}
            className="w-full text-xs h-8"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                서버 핑 확인 중...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                백엔드 서버 연결 상태 테스트
              </>
            )}
          </Button>

          {testResult && (
            <div
              className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${testResult.success
                ? 'bg-muted/40 border-border text-foreground'
                : 'border-destructive/60 bg-destructive/10 text-destructive'
                }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-foreground" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
              )}
              <div className="space-y-0.5 flex-1">
                <div className="font-semibold flex items-center justify-between">
                  <span>{testResult.success ? '백엔드 정상 작동' : '연결 실패'}</span>
                  {testResult.success && (
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {testResult.latencyMs}ms
                    </span>
                  )}
                </div>
                <p className="text-[11px] opacity-90 leading-tight">
                  {testResult.message}
                </p>
                {testResult.model && (
                  <p className="text-[10px] text-muted-foreground pt-0.5">
                    연결 모델: <span className="font-mono font-medium">{testResult.model}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

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
              프롬프트 보정 결과 언어 (이미지 전용 태그는 영문 유지)
            </p>
          </div>
          <div className="w-[130px]">
            <Select
              value={settings.preferredLanguage}
              onValueChange={(val) => handleChange('preferredLanguage', val)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어 (Korean)</SelectItem>
                <SelectItem value="en">영어 (English)</SelectItem>
                <SelectItem value="auto">자동 감지</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};
