
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ThemedButton } from "@/components/ui/themed-button";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();
  const { user, login, signup, session } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { success, error } = await login(email, password);
      if (success) {
        navigate("/");
      }
    } catch (error) {
      toast.error("Anmeldung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Improved error handling
      if (password.length < 6) {
        toast.error("Das Passwort muss mindestens 6 Zeichen lang sein.");
        setLoading(false);
        return;
      }
      
      const { success, error } = await signup(email, password);
      
      if (success) {
        // Show success message
        setRegistrationSuccess(true);
        toast.success("Registrierung erfolgreich. Bitte überprüfen Sie Ihre E-Mail zur Bestätigung.");
      } else if (error) {
        // Handle specific errors with more user-friendly messages
        if (error.includes("User already registered")) {
          toast.error("Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an.");
        } else {
          toast.error(error);
        }
      }
    } catch (error: any) {
      // This is a fallback error handler
      console.error("Unhandled signup error:", error);
      toast.error("Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">CRMbeauty</CardTitle>
          <CardDescription>
            Melden Sie sich an, um Ihr Konto zu verwalten
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Anmelden</TabsTrigger>
            <TabsTrigger value="signup">Registrieren</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@beispiel.de" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Anmeldung...
                    </>
                  ) : "Anmelden"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            {registrationSuccess ? (
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="rounded-full bg-green-100 w-12 h-12 mx-auto flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium">Registrierung erfolgreich!</h3>
                  <p className="text-muted-foreground">
                    Bitte überprüfen Sie Ihr E-Mail-Postfach, um Ihr Konto zu bestätigen.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setRegistrationSuccess(false)}
                  >
                    Zurück zur Registrierung
                  </Button>
                </div>
              </CardContent>
            ) : (
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-Mail</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="name@beispiel.de" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Passwort</Label>
                    <Input 
                      id="signup-password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Passwort muss mindestens 6 Zeichen lang sein.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrierung...
                      </>
                    ) : "Registrieren"}
                  </Button>
                </CardFooter>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
