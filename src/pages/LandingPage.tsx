
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const LandingPage = () => {
  const { isLoggedIn } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b py-4 px-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">SalesRun</h1>
        
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Button asChild variant="default">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <Button asChild variant="default">
              <Link to="/auth">Login / Register</Link>
            </Button>
          )}
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to SalesRun</h1>
          <p className="text-xl mb-8">Your all-in-one platform for managing sales, contacts, and more</p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            {isLoggedIn ? (
              <Button asChild size="lg">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/auth?tab=signup">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
      
      <footer className="border-t py-4 px-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} SalesRun. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
