
import React from "react";
import { Route } from "react-router-dom";
import SprintAnalysisPage from "@/pages/SprintAnalysisPage";
import { ObjectRecordDetail } from "@/pages/ObjectRecordDetail";

export const SprintRoutes = (
  <>
    <Route 
      path="/objects/:objectTypeId/:recordId" 
      element={<ObjectRecordDetail />} 
    />
    <Route 
      path="/objects/:objectTypeId/:recordId/analysis" 
      element={<SprintAnalysisPage />} 
    />
  </>
);

export default SprintRoutes;
