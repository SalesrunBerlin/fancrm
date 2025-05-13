
import React from "react";
import { Route } from "react-router-dom";
import SprintAnalysisPage from "@/pages/SprintAnalysisPage";

const SprintRoutes = (
  <>
    <Route path="/objects/:objectTypeId/:recordId/analysis" element={<SprintAnalysisPage />} />
  </>
);

export default SprintRoutes;
