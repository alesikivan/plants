'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Loader } from 'lucide-react';
import { adminApi, ActivityBucket } from '@/lib/api/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type RangeKey = 'day' | 'threeDays' | 'week';

const RANGES: { key: RangeKey; label: string; hours: number }[] = [
  { key: 'day', label: 'Сутки', hours: 24 },
  { key: 'threeDays', label: '3 дня', hours: 72 },
  { key: 'week', label: 'Неделя', hours: 168 },
];

// Stack order: bottom -> top. Colors are categorical slots 1-2 (see style block below)
const SERIES = [
  { key: 'plants', label: 'Новые растения', color: 'var(--activity-series-1)' },
  { key: 'history', label: 'Записи истории', color: 'var(--activity-series-2)' },
] as const;

const HEIGHT = 220;
const MARGIN = { top: 8, right: 8, bottom: 28, left: 32 };
const MAX_BAR_WIDTH = 24;
const SEGMENT_GAP = 2;

const hourFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const dayFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
const dayShortFormatter = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' });

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= value / 4)! * magnitude;
  return Math.ceil(value / step) * step;
}

// Column path with a rounded data-end (top) and a square base
function columnPath(x: number, y: number, width: number, height: number, rounded: boolean): string {
  if (height <= 0) return '';
  const r = rounded ? Math.min(4, width / 2, height) : 0;
  return [
    `M${x},${y + height}`,
    `V${y + r}`,
    r ? `Q${x},${y} ${x + r},${y}` : '',
    `H${x + width - r}`,
    r ? `Q${x + width},${y} ${x + width},${y + r}` : '',
    `V${y + height}`,
    'Z',
  ].join(' ');
}

function formatHourRange(iso: string): string {
  const start = new Date(iso);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return `${dayFormatter.format(start)}, ${hourFormatter.format(start)}–${hourFormatter.format(end)}`;
}

export function ActivityChart() {
  const [range, setRange] = useState<RangeKey>('day');
  const [hovered, setHovered] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => adminApi.getActivity(168),
    refetchInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [isLoading]);

  const hours = RANGES.find((r) => r.key === range)!.hours;
  const buckets: ActivityBucket[] = useMemo(() => (data ?? []).slice(-hours), [data, hours]);

  const totals = useMemo(
    () => ({
      plants: buckets.reduce((sum, b) => sum + b.plants, 0),
      history: buckets.reduce((sum, b) => sum + b.history, 0),
    }),
    [buckets],
  );

  const yMax = niceMax(Math.max(0, ...buckets.map((b) => b.plants + b.history)));
  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const band = buckets.length ? innerWidth / buckets.length : 0;
  const barWidth = Math.max(1, Math.min(MAX_BAR_WIDTH, band * (band > 6 ? 0.7 : 0.8)));
  const y = (value: number) => (value / yMax) * innerHeight;
  const yTicks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax];

  // X labels: every 3h for a day, every 12h for 3 days, midnights for a week
  const labelEvery = range === 'day' ? 3 : range === 'threeDays' ? 12 : 24;
  const xLabels = buckets
    .map((b, i) => ({ date: new Date(b.hour), i }))
    .filter(({ date }) => date.getHours() % labelEvery === 0);

  const hoveredBucket = hovered !== null ? buckets[hovered] : null;
  const tooltipLeft =
    hovered !== null ? Math.min(Math.max(MARGIN.left + band * (hovered + 0.5), 90), width - 90) : 0;

  return (
    <Card>
      <style>{`
        .activity-chart {
          --activity-series-1: #2a78d6;
          --activity-series-2: #eb6834;
        }
        .dark .activity-chart {
          --activity-series-1: #3987e5;
          --activity-series-2: #d95926;
        }
      `}</style>
      <CardHeader>
        <div className="space-y-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Активность по часам
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <Button
                key={r.key}
                variant={range === r.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setRange(r.key);
                  setHovered(null);
                }}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="activity-chart space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Legend with period totals */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {SERIES.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold">{totals[s.key].toLocaleString('ru-RU')}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Всего</span>
                <span className="font-semibold">
                  {(totals.plants + totals.history).toLocaleString('ru-RU')}
                </span>
              </div>
            </div>

            <div ref={containerRef} className="relative w-full" onPointerLeave={() => setHovered(null)}>
              {width > 0 && (
                <svg
                  width={width}
                  height={HEIGHT}
                  role="img"
                  aria-label={`Активность по часам: ${totals.plants} растений и ${totals.history} записей истории`}
                  className="block"
                >
                  {/* Grid + Y labels */}
                  {yTicks.map((tick) => {
                    const ty = MARGIN.top + innerHeight - y(tick);
                    return (
                      <g key={tick}>
                        <line
                          x1={MARGIN.left}
                          x2={width - MARGIN.right}
                          y1={ty}
                          y2={ty}
                          className={tick === 0 ? 'stroke-border' : 'stroke-border/50'}
                          strokeWidth={1}
                        />
                        <text
                          x={MARGIN.left - 6}
                          y={ty}
                          dy="0.32em"
                          textAnchor="end"
                          className="fill-muted-foreground text-[10px] tabular-nums"
                        >
                          {Number.isInteger(tick) ? tick : tick.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Stacked columns */}
                  {buckets.map((b, i) => {
                    const x = MARGIN.left + band * i + (band - barWidth) / 2;
                    const plantsHeight = y(b.plants);
                    const historyHeight = y(b.history);
                    const base = MARGIN.top + innerHeight;
                    const gap = b.plants > 0 && b.history > 0 ? SEGMENT_GAP : 0;
                    const dimmed = hovered !== null && hovered !== i;
                    return (
                      <g key={b.hour} opacity={dimmed ? 0.45 : 1}>
                        {b.plants > 0 && (
                          <path
                            d={columnPath(x, base - plantsHeight, barWidth, plantsHeight, b.history === 0)}
                            fill={SERIES[0].color}
                          />
                        )}
                        {b.history > 0 && (
                          <path
                            d={columnPath(
                              x,
                              base - plantsHeight - historyHeight,
                              barWidth,
                              Math.max(historyHeight - gap, 1),
                              true,
                            )}
                            fill={SERIES[1].color}
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* X labels */}
                  {xLabels.map(({ date, i }) => (
                    <text
                      key={i}
                      x={MARGIN.left + band * (i + 0.5)}
                      y={HEIGHT - 8}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px] tabular-nums"
                    >
                      {range === 'day' || date.getHours() !== 0
                        ? hourFormatter.format(date)
                        : dayShortFormatter.format(date)}
                    </text>
                  ))}

                  {/* Hit targets: full-height band per hour */}
                  {buckets.map((b, i) => (
                    <rect
                      key={`hit-${b.hour}`}
                      x={MARGIN.left + band * i}
                      y={MARGIN.top}
                      width={band}
                      height={innerHeight}
                      fill="transparent"
                      onPointerEnter={() => setHovered(i)}
                      onPointerDown={() => setHovered(i)}
                    />
                  ))}
                </svg>
              )}

              {hoveredBucket && (
                <div
                  className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-xs shadow-md"
                  style={{ left: tooltipLeft }}
                >
                  <div className="mb-1 text-muted-foreground">{formatHourRange(hoveredBucket.hour)}</div>
                  {SERIES.map((s) => (
                    <div key={s.key} className="flex items-center gap-2 whitespace-nowrap">
                      <span className="h-0.5 w-3 shrink-0" style={{ background: s.color }} />
                      <span className="font-semibold tabular-nums">{hoveredBucket[s.key]}</span>
                      <span className="text-muted-foreground">{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Button variant="ghost" size="sm" className="px-0" onClick={() => setShowTable((v) => !v)}>
                {showTable ? 'Скрыть таблицу' : 'Показать таблицей'}
              </Button>
              {showTable && (
                <div className="max-h-64 overflow-y-auto border rounded-md mt-2">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium px-3 py-1.5">Час</th>
                        {SERIES.map((s) => (
                          <th key={s.key} className="text-right font-medium px-3 py-1.5">
                            {s.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {buckets
                        .filter((b) => b.plants + b.history > 0)
                        .reverse()
                        .map((b) => (
                          <tr key={b.hour} className="border-t">
                            <td className="px-3 py-1.5">{formatHourRange(b.hour)}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{b.plants}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{b.history}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {buckets.every((b) => b.plants + b.history === 0) && (
                    <div className="py-6 text-center text-muted-foreground">Нет активности за период</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
