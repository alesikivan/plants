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

// Colors are categorical slots 1-2 (see style block below)
const SERIES = [
  { key: 'plants', label: 'Новые растения', color: 'var(--activity-series-1)' },
  { key: 'history', label: 'Записи истории', color: 'var(--activity-series-2)' },
] as const;

const HEIGHT = 220;
const MARGIN = { top: 8, right: 12, bottom: 28, left: 32 };

const hourFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const dayFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
const dayShortFormatter = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' });

// Integer tick step so that 4 steps cover the value (counts are whole numbers)
function niceStep(value: number): number {
  const raw = Math.max(1, value / 4);
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  return Math.max(1, [1, 2, 5, 10].find((m) => m * magnitude >= raw)! * magnitude);
}

// Smooth curve through points (monotone cubic: no overshoot below zero or above peaks)
function monotonePath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M${points[0].x},${points[0].y}`;

  const dx: number[] = [];
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    slopes.push((points[i + 1].y - points[i].y) / dx[i]);
  }

  const tangents: number[] = [slopes[0]];
  for (let i = 1; i < n - 1; i++) {
    tangents.push(slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2);
  }
  tangents.push(slopes[n - 2]);

  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      tangents[i] = t * a * slopes[i];
      tangents[i + 1] = t * b * slopes[i];
    }
  }

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const step = dx[i] / 3;
    d += ` C${p0.x + step},${p0.y + tangents[i] * step} ${p1.x - step},${p1.y - tangents[i + 1] * step} ${p1.x},${p1.y}`;
  }
  return d;
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

  const yStep = niceStep(Math.max(0, ...buckets.map((b) => Math.max(b.plants, b.history))));
  const yMax = yStep * 4;
  const yTicks = [0, 1, 2, 3, 4].map((k) => k * yStep);
  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const xStep = buckets.length > 1 ? innerWidth / (buckets.length - 1) : 0;
  const xAt = (i: number) => MARGIN.left + xStep * i;
  const yAt = (value: number) => MARGIN.top + innerHeight - (value / yMax) * innerHeight;

  // X labels: every 3h for a day, every 12h for 3 days, midnights for a week
  const labelEvery = range === 'day' ? 3 : range === 'threeDays' ? 12 : 24;
  const xLabels = buckets
    .map((b, i) => ({ date: new Date(b.hour), i }))
    .filter(({ date }) => date.getHours() % labelEvery === 0);

  const hoveredBucket = hovered !== null ? buckets[hovered] : null;
  const tooltipLeft = hovered !== null ? Math.min(Math.max(xAt(hovered), 90), width - 90) : 0;

  // Crosshair: nearest hour to the pointer
  const handlePointer = (event: React.PointerEvent<SVGRectElement>) => {
    if (!buckets.length || xStep === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const index = Math.round((event.clientX - rect.left) / xStep);
    setHovered(Math.min(Math.max(index, 0), buckets.length - 1));
  };

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
                  <span className="h-0.5 w-4 rounded-full shrink-0" style={{ background: s.color }} />
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
                  {yTicks.map((tick) => (
                    <g key={tick}>
                      <line
                        x1={MARGIN.left}
                        x2={width - MARGIN.right}
                        y1={yAt(tick)}
                        y2={yAt(tick)}
                        className={tick === 0 ? 'stroke-border' : 'stroke-border/50'}
                        strokeWidth={1}
                      />
                      <text
                        x={MARGIN.left - 6}
                        y={yAt(tick)}
                        dy="0.32em"
                        textAnchor="end"
                        className="fill-muted-foreground text-[10px] tabular-nums"
                      >
                        {tick}
                      </text>
                    </g>
                  ))}

                  {/* X labels */}
                  {xLabels.map(({ date, i }) => (
                    <text
                      key={i}
                      x={xAt(i)}
                      y={HEIGHT - 8}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px] tabular-nums"
                    >
                      {range === 'day' || date.getHours() !== 0
                        ? hourFormatter.format(date)
                        : dayShortFormatter.format(date)}
                    </text>
                  ))}

                  {/* Crosshair */}
                  {hovered !== null && (
                    <line
                      x1={xAt(hovered)}
                      x2={xAt(hovered)}
                      y1={MARGIN.top}
                      y2={MARGIN.top + innerHeight}
                      className="stroke-muted-foreground/40"
                      strokeWidth={1}
                    />
                  )}

                  {/* Curves */}
                  {SERIES.map((s) => (
                    <path
                      key={s.key}
                      d={monotonePath(buckets.map((b, i) => ({ x: xAt(i), y: yAt(b[s.key]) })))}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  ))}

                  {/* Hovered points */}
                  {hoveredBucket &&
                    SERIES.map((s) => (
                      <circle
                        key={s.key}
                        cx={xAt(hovered!)}
                        cy={yAt(hoveredBucket[s.key])}
                        r={4}
                        fill={s.color}
                        className="stroke-card"
                        strokeWidth={2}
                      />
                    ))}

                  {/* Hit target for the crosshair */}
                  <rect
                    x={MARGIN.left - xStep / 2}
                    y={MARGIN.top}
                    width={innerWidth + xStep}
                    height={innerHeight}
                    fill="transparent"
                    onPointerMove={handlePointer}
                    onPointerDown={handlePointer}
                  />
                </svg>
              )}

              {hoveredBucket && (
                <div
                  className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-3 py-2 text-xs shadow-md"
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
