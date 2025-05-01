
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { Layout } from "@/components/layout";
import ObjectRecordsList from "@/components/records/RecordsTable";
import ObjectRecordDetail from "@/components/records/RecordDetailForm";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import ImportRecordsPage from "@/pages/ImportRecordsPage";
import ImportCreateFieldPage from "@/pages/ImportCreateFieldPage";

// Create placeholder components for missing pages
const ObjectTypesList = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4">Object Types</h1>
    <p>Object types list will be displayed here.</p>
  </div>
);

const ObjectTypeDetail = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4">Object Type Details</h1>
    <p>Object type details will be displayed here.</p>
  </div>
);

const ObjectTypeCreate = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4">Create Object Type</h1>
    <p>Create object type form will be displayed here.</p>
  </div>
);

const ObjectTypeEdit = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4">Edit Object Type</h1>
    <p>Edit object type form will be displayed here.</p>
  </div>
);

const ObjectRecordCreate = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4">Create Record</h1>
    <p>Create record form will be displayed here.</p>
  </div>
);

const ObjectRecordEdit = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4">Edit Record</h1>
    <p>Edit record form will be displayed here.</p>
  </div>
);

const SettingsPage = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4">Settings</h1>
    <p>Settings will be displayed here.</p>
  </div>
);

const LoginPage = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="p-8 bg-white rounded shadow-md">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <p>Login form will be displayed here.</p>
    </div>
  </div>
);

const LoadingPage = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

function App() {
  const { user, isLoading } = useAuth();
  const isLoggedIn = !!user;
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
