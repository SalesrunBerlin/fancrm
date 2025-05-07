
import { useState, useEffect } from "react";
import { useApplications, Application } from "@/hooks/useApplications";
import { useApplicationObjects } from "@/hooks/useApplicationObjects";
import { ObjectType } from "@/hooks/useObjectTypes";
import { useActions } from "@/hooks/useActions";

export function useCurrentApplicationData() {
  const { applications, isLoading: isLoadingApps } = useApplications();
  const [currentAppId, setCurrentAppId] = useState<string | undefined>(undefined);
  const [appObjects, setAppObjects] = useState<ObjectType[]>([]);
  const { applicationObjects, isLoading: isLoadingObjects } = useApplicationObjects(currentAppId);

  // Get the current default application on mount
  useEffect(() => {
    if (applications?.length) {
      const defaultApp = applications.find(app => app.is_default);
      if (defaultApp) {
        setCurrentAppId(defaultApp.id);
      } else if (applications[0]) {
        // Fallback to first app if no default
        setCurrentAppId(applications[0].id);
      }
    }
  }, [applications]);

  // Update app objects when they change
  useEffect(() => {
    if (applicationObjects) {
      setAppObjects(applicationObjects);
    }
  }, [applicationObjects]);

  const isLoading = isLoadingApps || isLoadingObjects || !currentAppId;
  const currentApplication = applications?.find(app => app.id === currentAppId);

  return {
    applications,
    currentAppId,
    currentApplication,
    appObjects,
    isLoading
  };
}
