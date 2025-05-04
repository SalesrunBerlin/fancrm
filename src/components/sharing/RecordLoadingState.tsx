
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function RecordLoadingState() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center items-center h-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="grid grid-cols-1 lg:grid-cols-3 gap-2">
              <Skeleton className="h-6 w-full" />
              <div className="lg:col-span-2">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
