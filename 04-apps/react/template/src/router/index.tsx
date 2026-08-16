<!-- PURPOSE OF THIS FILE: React Router konfigürasyonu — createBrowserRouter, layout route, lazy loading -->
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';

const HomePage = lazy(() => import('@/pages/HomePage'));
const {{ModelName}}ListPage = lazy(() => import('@/pages/{{ModelName}}ListPage'));
const {{ModelName}}DetailPage = lazy(() => import('@/pages/{{ModelName}}DetailPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: '{{model_names}}',
        element: <{{ModelName}}ListPage />,
      },
      {
        path: '{{model_names}}/:id',
        element: <{{ModelName}}DetailPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
