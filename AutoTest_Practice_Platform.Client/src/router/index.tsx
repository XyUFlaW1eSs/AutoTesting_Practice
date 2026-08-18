import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { TaskList } from '../pages/TaskList';
import { FileManagement } from '../pages/FileManagement';
import { Register } from '../pages/Register';
import { ReportHistory } from '../pages/ReportHistory';
import { ResourceList } from '../pages/ResourceList';
import { CardManagement } from '../pages/CardManagement';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: 'cards',
    element: <CardManagement />,
  },
  {
    // 根路径包裹上 AuthLayout 守卫
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        // 访问根目录直接重定向到看板
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      // 后续如任务列表、报表页面等，都挂载到这里
      {
        path: 'tasks',
        element: <TaskList />
      },
      {
        path: 'files',
        element: <FileManagement />
      },
      {
        path: 'reports',
        element: <ReportHistory />
      },
      {
        path: 'resources',
        element: <ResourceList />,
      },
      {
        path: 'cards',
        element: <CardManagement />,
      },
    ],
  },
]);