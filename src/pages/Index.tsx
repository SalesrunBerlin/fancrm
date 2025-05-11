
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { isLoggedIn } = useAuth();
  
  // If user is logged in, go to dashboard
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If not logged in, go to auth page directly
  return <Navigate to="/auth" replace />;
};

export default Index;
