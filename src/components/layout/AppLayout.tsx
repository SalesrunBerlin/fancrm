
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Layout } from './Layout';
import { useAuth } from '@/contexts/AuthContext';

export function AppLayout() {
  const { isLoggedIn, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
