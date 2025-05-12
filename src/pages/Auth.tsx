
import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const { user, isLoading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [workspace, setWorkspace] = useState<any | null>(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId?: string }>();

  useEffect(() => {
    // If we have a workspaceId, fetch the workspace details
    const fetchWorkspace = async () => {
      if (!workspaceId) return;
      
      try {
        setIsLoadingWorkspace(true);
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceId)
          .single();
          
        if (error) throw error;
        setWorkspace(data);
      } catch (error) {
        console.error('Error fetching workspace:', error);
        setError('Der Workspace wurde nicht gefunden.');
      } finally {
        setIsLoadingWorkspace(false);
      }
    };
    
    fetchWorkspace();
  }, [workspaceId]);
  
  // Redirect if already logged in
  if (user && !isLoading) {
    return <Navigate to="/dashboard" />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSigningIn(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error signing in:', error);
      setError('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSigningUp(true);

    try {
      await signUp(email, password, firstName, lastName);
      setActiveTab('signin');
      setError('Bitte bestätigen Sie Ihre E-Mail-Adresse. Anschließend können Sie sich anmelden.');
    } catch (error: any) {
      console.error('Error signing up:', error);
      setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const getWelcomeMessage = () => {
    if (workspace) {
      return workspace.welcome_message || 'Willkommen! Bitte geben Sie Ihre Zugangsdaten ein, um auf den Workspace zuzugreifen.';
    }
    return 'Willkommen! Bitte melden Sie sich an, um fortzufahren.';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      backgroundColor: workspace?.primary_color ? `${workspace.primary_color}15` : undefined,
    }}>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        {isLoadingWorkspace ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">
                {workspace ? workspace.name : 'Anmeldung'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {getWelcomeMessage()}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex border-b mb-4">
              <button
                className={`flex-1 py-2 font-medium ${
                  activeTab === 'signin'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                onClick={() => setActiveTab('signin')}
              >
                Anmelden
              </button>
              {!workspaceId && (
                <button
                  className={`flex-1 py-2 font-medium ${
                    activeTab === 'signup'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  onClick={() => setActiveTab('signup')}
                >
                  Registrieren
                </button>
              )}
            </div>

            {activeTab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    E-Mail
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1">
                    Passwort
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" disabled={isSigningIn} className="w-full" style={{
                  backgroundColor: workspace?.primary_color,
                }}>
                  {isSigningIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Anmelden...
                    </>
                  ) : (
                    'Anmelden'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                      Vorname
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Max"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                      Nachname
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Mustermann"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email-signup" className="block text-sm font-medium mb-1">
                    E-Mail
                  </label>
                  <Input
                    id="email-signup"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password-signup" className="block text-sm font-medium mb-1">
                    Passwort
                  </label>
                  <Input
                    id="password-signup"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={isSigningUp} className="w-full">
                  {isSigningUp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrieren...
                    </>
                  ) : (
                    'Registrieren'
                  )}
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
