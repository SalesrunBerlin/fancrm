
import React from 'react';
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Welcome to your dashboard"
      />
      
      <Card>
        <CardContent className="pt-6">
          <p>Welcome to your dashboard. Navigate to other sections using the menu.</p>
        </CardContent>
      </Card>
    </div>
  );
}
