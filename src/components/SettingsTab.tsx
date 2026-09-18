import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { testApiConnection } from '@/services/aiService';
import {
  Key,
  Globe,
  Cpu,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Zap,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    apiKey: '',
    baseUrl: 'https://opencode.ai/zen/go/v1',
    model: 'deepseek-v4.1-flash',
    floatingBadgeEnabled: true,
    preferredLanguage: 'ko',
    defaultImageEngine: 'midjourney',
  });

  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
  } | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((s) => setSettings(s));
  }, []);

  const handleChange = (key: keyof AppSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await saveSettings(settings);
    setSaveStatus('설정이 저장되었습니다.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleTestConnection = async () => {
    if (!settings.apiKey) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: 'OpenCode Go API 키를 입력해주세요.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testApiConnection(
      settings.apiKey,
      settings.baseUrl,
      settings.model
    );

    setTestResult(res);
    setIsTesting(false);
  };

  return (
    <div className="space-y-4">
      {/* Intro Card */}
      <Card>
        <CardHeader className="p-3.5 pb-2 border-b">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            OpenCode Go & DeepSeek V4.1 Flash 연동
          </CardTitle>
          <CardDescription className="text-[11px]">
            DeepSeek V4.1 Flash 모델을 사용하여 프롬프트를 실시간 분석·교정합니다. OpenCode Go API 키를 입력하세요.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Settings Form */}
      <Card>
        <CardContent className="p-3.5 space-y-3.5">
          {/* API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="api-key" className="text-xs flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-muted-foreground" />
                OpenCode Go API Key
              </Label>
              <a
                href="https://opencode.ai"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 underline-offset-4 hover:underline"
              >
                키 발급
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                placeholder="sk-..."
                value={settings.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                className="pr-9 font-mono text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              * API 키는 브라우저 로컬 저장소에 안전하게 보관됩니다.
            </p>
          </div>

          <Separator />

          {/* Base URL */}
          <div className="space-y-1.5">
            <Label htmlFor="base-url" className="text-xs flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              API 엔드포인트 URL
            </Label>
            <Input
              id="base-url"
              type="text"
              placeholder="https://opencode.ai/zen/go/v1"
              value={settings.baseUrl}
              onChange={(e) => handleChange('baseUrl', e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <Separator />

          {/* Model Name */}
          <div className="space-y-1.5">
            <Label htmlFor="model-name" className="text-xs flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
              AI 모델 식별자
            </Label>
            <div className="flex gap-2">
              <Input
                id="model-name"
                type="text"
                value={settings.model}
                onChange={(e) => handleChange('model', e.target.value)}
                className="font-mono text-xs flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleChange('model', 'deepseek-v4.1-flash')}
                className="text-xs shrink-0"
              >
                기본값
              </Button>
            </div>
          </div>

          <Separator />

          {/* Connection Test */}
          <div className="pt-0.5 space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="w-full text-xs h-8.5"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  엔드포인트 핑 테스트 중...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  API 연결 상태 테스트
                </>
              )}
            </Button>

            {testResult && (
              <div
                className={`p-2.5 rounded-md border text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-muted/40 border-border text-foreground'
                    : 'border-destructive text-destructive'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="font-semibold flex items-center gap-2">
                    {testResult.success ? '연결 정상' : '연결 실패'}
                    {testResult.success && (
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {testResult.latencyMs}ms
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] opacity-90 leading-tight">
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Behavior Preferences Card */}
      <Card>
        <CardContent className="p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold">
                웹페이지 플로팅 뱃지 표시
              </Label>
              <p className="text-[11px] text-muted-foreground">
                ChatGPT, Midjourney 등의 입력창 우측 하단에 Grammarly 스타일 뱃지 표시
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

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold">
                기본 추천 언어
              </Label>
              <p className="text-[11px] text-muted-foreground">
                프롬프트 보정 결과 언어 (이미지 전용 태그는 항상 영문 유지)
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
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="space-y-2">
        <Button
          onClick={handleSave}
          className="w-full text-xs h-9"
        >
          설정 저장하기
        </Button>

        {saveStatus && (
          <p className="text-center text-xs font-medium text-foreground animate-fade-in">
            {saveStatus}
          </p>
        )}
      </div>
    </div>
  );
};
