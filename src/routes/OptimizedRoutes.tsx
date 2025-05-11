
import { Route } from "react-router-dom";
import OptimizedRecordsList from "@/pages/OptimizedRecordsList";

export function OptimizedRoutes() {
  return (
    <>
      <Route path="/objects/:objectTypeId/optimized" element={<OptimizedRecordsList />} />
    </>
  );
}
