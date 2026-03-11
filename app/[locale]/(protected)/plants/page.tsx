'use client';

import { Suspense } from 'react';
import { PlantsPageContent } from './plants-content';

export default function MyPlantsPage() {
  return (
    <Suspense fallback={<PlantsPageSkeleton />}>
      <PlantsPageContent />
    </Suspense>
  );
}

function PlantsPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="h-20 bg-muted rounded-lg animate-pulse" />
      <div className="h-96 bg-muted rounded-lg animate-pulse" />
    </div>
  );
}
