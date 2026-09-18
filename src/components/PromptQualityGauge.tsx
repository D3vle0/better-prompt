import React from 'react';
import { Badge } from '@/components/ui/badge';

interface PromptQualityGaugeProps {
  score: number; // 0 - 100
  size?: 'sm' | 'md' | 'lg';
}

export const PromptQualityGauge: React.FC<PromptQualityGaugeProps> = ({
  score,
  size = 'md',
}) => {
  let badgeVariant: 'destructive' | 'secondary' | 'default' | 'outline' = 'destructive';
  let statusText = '개선 시급 (초급)';
  let strokeColor = 'hsl(var(--destructive))';

  if (score >= 80) {
    badgeVariant = 'default';
    statusText = '최상급 (Master)';
    strokeColor = 'hsl(var(--foreground))';
  } else if (score >= 60) {
    badgeVariant = 'secondary';
    statusText = '양호함 (Good)';
    strokeColor = 'hsl(var(--foreground))';
  } else if (score >= 40) {
    badgeVariant = 'outline';
    statusText = '보통 (Needs Work)';
    strokeColor = 'hsl(var(--muted-foreground))';
  }

  const radius = size === 'sm' ? 22 : size === 'lg' ? 40 : 30;
  const strokeWidth = size === 'sm' ? 3.5 : size === 'lg' ? 6 : 4.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const svgSize = (radius + strokeWidth) * 2;

  return (
    <div className="flex items-center gap-3">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={svgSize}
          height={svgSize}
          className="transform -rotate-90 transition-all duration-700 ease-out"
        >
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            className="stroke-muted"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke={strokeColor}
            className="transition-all duration-700 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center font-mono">
          <span className={`font-semibold tracking-tight ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'}`}>
            {score}
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold">프롬프트 품질</span>
          <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0 h-4 font-normal">
            {statusText}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground mt-0.5">
          {score < 50
            ? '구체적인 서술과 스타일 키워드가 보완되어야 합니다'
            : score < 80
            ? '기본 구성이 양호합니다. 엔진 특화 태그로 완성도를 높이세요'
            : 'AI가 최적의 결과를 낼 수 있는 프롬프트입니다'}
        </span>
      </div>
    </div>
  );
};
