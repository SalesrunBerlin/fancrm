import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Home } from "@/pages/Home";
import { Contacts } from "@/pages/Contacts";
import { Accounts } from "@/pages/Accounts";
import { Activities } from "@/pages/Activities";
import { Settings } from "@/pages/Settings";
import { ObjectList } from "@/pages/ObjectList";
import { ObjectRecordDetail } from "@/pages/ObjectRecordDetail";
import { ObjectRecordCreate } from "@/pages/ObjectRecordCreate";
import { ObjectTypeCreate } from "@/pages/ObjectTypeCreate";
import { ObjectTypeDetail } from "@/pages/ObjectTypeDetail";
import { Applications } from "@/pages/Applications";
import { ApplicationDetail } from "@/pages/ApplicationDetail";
import { ApplicationCreate } from "@/pages/ApplicationCreate";
import { Help } from "@/pages/Help";
import { HelpTabDetail } from "@/pages/HelpTabDetail";
import { HelpTabCreate } from "@/pages/HelpTabCreate";
import { ActionList } from "@/pages/ActionList";
import { ActionDetail } from "@/pages/ActionDetail";
import { ActionCreate } from "@/pages/ActionCreate";

// Import SprintRoutes
import SprintRoutes from "@/routes/SprintRoutes";

export default function OptimizedRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/activities" element={<Activities />} />
      <Route path="/settings" element={<Settings />} />

      <Route path="/objects/:objectTypeId" element={<ObjectList />} />
      <Route path="/objects/:objectTypeId/:recordId" element={<ObjectRecordDetail />} />
      <Route path="/objects/:objectTypeId/create" element={<ObjectRecordCreate />} />

      <Route path="/object-types/create" element={<ObjectTypeCreate />} />
      <Route path="/object-types/:objectTypeId" element={<ObjectTypeDetail />} />

      <Route path="/applications" element={<Applications />} />
      <Route path="/applications/:applicationId" element={<ApplicationDetail />} />
      <Route path="/applications/create" element={<ApplicationCreate />} />

      <Route path="/help" element={<Help />} />
      <Route path="/help-tabs/:helpTabId" element={<HelpTabDetail />} />
      <Route path="/help-tabs/create" element={<HelpTabCreate />} />

      <Route path="/actions" element={<ActionList />} />
      <Route path="/actions/:actionId" element={<ActionDetail />} />
      <Route path="/actions/create" element={<ActionCreate />} />
      
      {/* Add Sprint routes */}
      {SprintRoutes}
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
