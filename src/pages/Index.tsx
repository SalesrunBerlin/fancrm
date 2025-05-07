
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { session } = useAuth();
  
  return session ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />;
};

export default Index;
