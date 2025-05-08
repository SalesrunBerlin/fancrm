
import React from 'react';
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ThemedButton } from '@/components/ui/themed-button';
import { Link } from 'react-router-dom';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        description="Manage your application settings"
      />
      
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-2">Workspace Management</h3>
                <p className="text-muted-foreground mb-4">Manage workspaces for your organization</p>
                <ThemedButton asChild>
                  <Link to="/admin/workspace">Manage Workspaces</Link>
                </ThemedButton>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
