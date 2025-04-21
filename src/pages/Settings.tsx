
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDealStatuses } from "@/hooks/useDealStatuses";
import { StatusForm } from "@/components/settings/StatusForm";
import { StatusList } from "@/components/settings/StatusList";
import { useTheme } from "@/hooks/useTheme";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const {
    dealStatuses,
    isLoading,
    createStatus,
    updateStatus,
    deleteStatus,
    initializeDefaultStatuses
  } = useDealStatuses();

  useEffect(() => {
    if (dealStatuses && dealStatuses.length === 0 && !isLoading) {
      initializeDefaultStatuses();
    }
  }, [dealStatuses, isLoading, initializeDefaultStatuses]);

  // Theme Toggle
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Einstellungen</h1>
      <Card className="p-6 space-y-4">
        <div className="flex items-center mb-6">
          <span className="font-semibold text-lg mr-4">Dark Mode</span>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>
        <h2 className="text-xl font-semibold mb-4">Deal Status Verwaltung</h2>
        <StatusForm 
          dealStatuses={dealStatuses || []} 
          createStatus={createStatus} 
          isPending={createStatus.isPending}
        />
        <StatusList 
          dealStatuses={dealStatuses || []}
          isLoading={isLoading}
          updateStatus={updateStatus}
          deleteStatus={deleteStatus}
        />
      </Card>
    </div>
  );
}
