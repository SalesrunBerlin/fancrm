
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isLoggedIn, isSuperAdmin } = useAuth();
  
  // If user is a super admin and they're trying to access admin pages
  if (isLoggedIn && isSuperAdmin) {
    // For development/debugging purposes, log that the user is a super admin
    console.log("User is a super admin, showing full dashboard");
  }
  
  // If user is logged in, go to dashboard, otherwise go to landing page
  return <Navigate to={isLoggedIn ? "/dashboard" : "/landing"} replace />;
};

export default Index;
