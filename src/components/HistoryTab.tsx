import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { HistoryItem } from '@/types';
import { getHistory, toggleFavorite, clearHistory } from '@/services/storage';
import {
  Star,
  Copy,
  Check,
  Trash2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const HistoryTab: React.FC<{ onSelectPrompt?: (text: string) => void }> = ({
  onSelectPrompt,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterFavorite, setFilterFavorite] = useState(false);

  const loadHistory = async () => {
    const items = await getHistory();
    setHistory(items);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleToggleFavorite = async (id: string) => {
    const updated = await toggleFavorite(id);
    setHistory(updated);
  };

  const handleClear = async () => {
    if (confirm('교정 히스토리를 모두 삭제하시겠습니까?')) {
      await clearHistory();
      setHistory([]);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredItems = filterFavorite
    ? history.filter((item) => item.isFavorite)
    : history;

  const formatTime = (timestamp: number) => {
    const diffMin = Math.round((Date.now() - timestamp) / (1000 * 60));
    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-3">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={!filterFavorite ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => setFilterFavorite(false)}
          >
            전체 ({history.length})
          </Button>
          <Button
            type="button"
            variant={filterFavorite ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => setFilterFavorite(true)}
          >
            <Star className="w-3 h-3 mr-1 fill-current" />
            즐겨찾기 ({history.filter((i) => i.isFavorite).length})
          </Button>
        </div>

        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            전체 삭제
          </Button>
        )}
      </div>

      <Separator />

      {/* List */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground space-y-2">
          <Clock className="w-8 h-8 mx-auto opacity-40" />
          <p className="text-xs font-medium">
            {filterFavorite ? '즐겨찾기된 프롬프트가 없습니다.' : '아직 교정된 프롬프트 기록이 없습니다.'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            새 프롬프트를 진단하면 자동으로 여기에 저장됩니다.
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[420px] pr-2">
          <div className="space-y-2.5">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {item.category === 'image' ? '이미지' : item.category === 'code' ? '코드' : '텍스트'}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                        점수 {item.qualityScore}점
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleToggleFavorite(item.id)}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          item.isFavorite ? 'fill-foreground text-foreground' : ''
                        }`}
                      />
                    </Button>
                  </div>

                  {/* Original Snippet */}
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    <span className="font-semibold text-foreground mr-1">원문:</span>
                    {item.originalPrompt}
                  </div>

                  {/* Enhanced Snippet */}
                  <div className="p-2 rounded-md bg-muted/40 border text-xs font-mono text-foreground whitespace-pre-wrap max-h-[80px] overflow-y-auto">
                    {item.enhancedPrompt}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    {onSelectPrompt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectPrompt(item.enhancedPrompt)}
                        className="text-xs h-7 px-2"
                      >
                        <ArrowRight className="w-3 h-3 mr-1" />
                        사용하기
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(item.enhancedPrompt, item.id)}
                      className="text-xs h-7 px-2.5"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          복사
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
