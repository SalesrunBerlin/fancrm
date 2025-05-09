
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isLoggedIn } = useAuth();
  
  // If user is logged in, go to dashboard, otherwise go to landing page
  return <Navigate to={isLoggedIn ? "/dashboard" : "/"} replace />;
};

export default Index;
