
import React from 'react';
import { RouteObject } from 'react-router-dom';
import CreateWorkspacePage from './pages/admin/CreateWorkspacePage';

export const customRoutes: RouteObject[] = [
  {
    path: '/admin/workspace/create',
    element: <CreateWorkspacePage />
  }
];
