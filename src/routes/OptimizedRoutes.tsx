
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ObjectRecordDetail } from "@/pages/ObjectRecordDetail";

// Import SprintRoutes
import SprintRoutes from "@/routes/SprintRoutes";

export default function OptimizedRoutes() {
  return (
    <Routes>
      <Route path="/objects/:objectTypeId/:recordId" element={<ObjectRecordDetail />} />
      
      {/* Add Sprint routes */}
      {SprintRoutes}
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
