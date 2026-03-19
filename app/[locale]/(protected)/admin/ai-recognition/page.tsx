'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  CheckCircle2,
  XCircle,
  BookOpen,
  Tag,
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
} from 'lucide-react';
import { aiRecognitionApi, AiRecognitionLog } from '@/lib/api/ai-recognition';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

type TypeFilter = 'all' | 'genus' | 'variety';
type RecognizedFilter = 'all' | 'true' | 'false';

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  sub?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-0.5">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-muted ${color ?? ''}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function LogRow({ log }: { log: AiRecognitionLog }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="mt-0.5 shrink-0">
        {log.recognized ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${log.type === 'genus' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {log.type === 'genus' ? 'Род' : 'Сорт'}
          </span>
          <span className="text-sm font-medium truncate">«{log.query}»</span>
          {log.recognized && (log.resultNameRu || log.resultNameEn) && (
            <span className="text-xs text-muted-foreground truncate">
              → {[log.resultNameRu, log.resultNameEn].filter(Boolean).join(' / ')}
            </span>
          )}
        </div>
        {log.type === 'variety' && log.genusNameRu && (
          <p className="text-xs text-muted-foreground">
            Род: {[log.genusNameRu, log.genusNameEn].filter(Boolean).join(' / ')}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {log.userName ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              {log.userName}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Аноним</span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ru })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AiRecognitionPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [recognizedFilter, setRecognizedFilter] = useState<RecognizedFilter>('all');
  // cursorStack[0] = undefined (first page), cursorStack[1] = cursor after page 1, etc.
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined]);
  const currentPage = cursorStack.length; // 1-based
  const currentCursor = cursorStack[cursorStack.length - 1];

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'ai-recognition', 'stats'],
    queryFn: () => aiRecognitionApi.getStats(),
  });

  const { data: list, isLoading: listLoading } = useQuery({
    queryKey: ['admin', 'ai-recognition', 'list', currentCursor, typeFilter, recognizedFilter],
    queryFn: () =>
      aiRecognitionApi.getList({
        page: currentPage,
        limit: 20,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        recognized: recognizedFilter !== 'all' ? recognizedFilter === 'true' : undefined,
        cursor: currentCursor,
      }),
  });

  const handleFilterChange = () => setCursorStack([undefined]);

  const goNext = () => {
    if (list?.nextCursor) {
      setCursorStack((s) => [...s, list.nextCursor]);
    }
  };

  const goPrev = () => {
    if (cursorStack.length > 1) {
      setCursorStack((s) => s.slice(0, -1));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">ИИ распознавание</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Статистика запросов на распознавание рода и сорта
        </p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Загрузка...
        </div>
      ) : stats ? (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              title="Всего запросов"
              value={stats.total}
              icon={Brain}
            />
            <StatCard
              title="Распознано"
              value={`${stats.recognized} (${stats.recognizedPercent}%)`}
              icon={CheckCircle2}
              color="text-green-600"
            />
            <StatCard
              title="Не распознано"
              value={`${stats.notRecognized} (${stats.notRecognizedPercent}%)`}
              icon={XCircle}
              color="text-red-600"
            />
            <StatCard
              title="За месяц"
              value={stats.period.lastMonth}
              sub={`Неделя: ${stats.period.lastWeek} · Сегодня: ${stats.period.today}`}
              icon={Brain}
            />
          </div>

          {/* By type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Genus */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Роды
                  <span className="font-normal text-muted-foreground ml-auto">
                    {stats.byType.genus.total} запросов
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600">
                    Распознано: {stats.byType.genus.recognized} ({stats.byType.genus.recognizedPercent}%)
                  </span>
                  <span className="text-red-600">
                    Не распознано: {stats.byType.genus.notRecognized}
                  </span>
                </div>
                <ProgressBar value={stats.byType.genus.recognizedPercent} color="bg-green-500" />
              </CardContent>
            </Card>

            {/* Variety */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Сорта
                  <span className="font-normal text-muted-foreground ml-auto">
                    {stats.byType.variety.total} запросов
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600">
                    Распознано: {stats.byType.variety.recognized} ({stats.byType.variety.recognizedPercent}%)
                  </span>
                  <span className="text-red-600">
                    Не распознано: {stats.byType.variety.notRecognized}
                  </span>
                </div>
                <ProgressBar value={stats.byType.variety.recognizedPercent} color="bg-green-500" />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Журнал запросов</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={typeFilter}
                onValueChange={(v) => { setTypeFilter(v as TypeFilter); handleFilterChange(); }}
              >
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="genus">Роды</SelectItem>
                  <SelectItem value="variety">Сорта</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={recognizedFilter}
                onValueChange={(v) => { setRecognizedFilter(v as RecognizedFilter); handleFilterChange(); }}
              >
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue placeholder="Результат" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все результаты</SelectItem>
                  <SelectItem value="true">Распознано</SelectItem>
                  <SelectItem value="false">Не распознано</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {listLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Загрузка...
            </div>
          ) : list && list.items.length > 0 ? (
            <>
              <div>
                {list.items.map((log) => (
                  <LogRow key={log._id} log={log} />
                ))}
              </div>
              {(cursorStack.length > 1 || list.nextCursor) && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-muted-foreground">
                    {list.total} записей · стр. {currentPage} из {list.pages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cursorStack.length <= 1}
                      onClick={goPrev}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!list.nextCursor}
                      onClick={goNext}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Нет данных
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
