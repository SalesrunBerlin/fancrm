
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { Layout } from "@/components/layout";
import ObjectRecordsList from "@/pages/ObjectRecordsList";
import ObjectRecordDetail from "@/pages/ObjectRecordDetail";
import ObjectRecordCreate from "@/pages/ObjectRecordCreate";
import ObjectRecordEdit from "@/pages/ObjectRecordEdit";
import ObjectTypesList from "@/pages/ObjectTypesList";
import ObjectTypeDetail from "@/pages/ObjectTypeDetail";
import ObjectTypeCreate from "@/pages/ObjectTypeCreate";
import ObjectTypeEdit from "@/pages/ObjectTypeEdit";
import SettingsPage from "@/pages/SettingsPage";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoginPage from "@/pages/LoginPage";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import LoadingPage from "@/pages/LoadingPage";
import ImportRecordsPage from "@/pages/ImportRecordsPage";
import ImportCreateFieldPage from "@/pages/ImportCreateFieldPage";

function App() {
  const { isLoggedIn, isLoading } = useAuth();
  const [router, setRouter] = useState(createBrowserRouter([]));

  useEffect(() => {
    if (isLoading) {
      // Render a loading indicator while authentication state is loading
      setRouter(createBrowserRouter([{ path: "*", element: <LoadingPage /> }]));
      return;
    }

    if (!isLoggedIn) {
      // If not logged in, show only the login page
      setRouter(createBrowserRouter([{ path: "*", element: <LoginPage /> }]));
      return;
    }

    // Define the routes when the user is logged in
    const loggedInRouter = createBrowserRouter([
      {
        path: "/",
        element: <Layout />,
        errorElement: <ErrorBoundary />,
        children: [
          { path: "/", element: <ObjectTypesList /> },
          { path: "/objects", element: <ObjectTypesList /> },
          { path: "/objects/new", element: <ObjectTypeCreate /> },
          { path: "/objects/:objectTypeId", element: <ObjectRecordsList /> },
          { path: "/objects/:objectTypeId/view", element: <ObjectTypeDetail /> },
          { path: "/objects/:objectTypeId/edit", element: <ObjectTypeEdit /> },
          { path: "/objects/:objectTypeId/new", element: <ObjectRecordCreate /> },
          { path: "/objects/:objectTypeId/:recordId", element: <ObjectRecordDetail /> },
          { path: "/objects/:objectTypeId/:recordId/edit", element: <ObjectRecordEdit /> },
          // Make sure we have the field creation route for import
          { path: "/objects/:objectTypeId/import", element: <ImportRecordsPage /> },
          { path: "/objects/:objectTypeId/import/create-field/:columnName", element: <ImportCreateFieldPage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
    ]);

    setRouter(loggedInRouter);
  }, [isLoggedIn, isLoading]);

  return (
    <RouterProvider router={router} />
  );
}

export default App;
