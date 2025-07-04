import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';

import AuthGuard from '@/routes/auth-guard';
import AppLayout from '@/layouts/app';
import ErrorLayout from '@/layouts/Error';
import Loadable from '@/components/Loadable';

const ApplicationsPage = Loadable(lazy(() => import('@/pages/applications')));
const ApplicationDetails = Loadable(lazy(() => import('@/pages/application-details')));
const Cluster = Loadable(lazy(() => import('@/pages/cluster')));
const SettingsPage = Loadable(lazy(() => import('@/pages/settings')));
const NotFound = Loadable(lazy(() => import('@/pages/not-found')));

const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouterV7(createBrowserRouter);

const router = sentryCreateBrowserRouter([
  {
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: '/',
        element: <Navigate to="/applications" replace />,
        handle: { title: 'Applications' },
      },
      {
        path: '/applications',
        element: <ApplicationsPage />,
        handle: { title: 'Applications' },
      },
      {
        path: '/applications/:slug',
        element: <ApplicationDetails />,
        handle: { title: 'Applications' },
      },
      {
        path: '/applications/:slug/envs/:env',
        element: <ApplicationDetails />,
        handle: { title: 'Applications' },
      },
      {
        path: '/applications/:slug/envs/:env/drafts',
        element: <ApplicationDetails />,
        handle: { title: 'Applications' },
      },
      {
        path: '/applications/:slug/envs/:env/drafts/:id',
        element: <ApplicationDetails />,
        handle: { title: 'Applications' },
      },
      {
        path: '/applications/:slug/envs/:env/diff/:a/:b',
        element: <ApplicationDetails />,
        handle: { title: 'Applications' },
      },
      {
        path: '/clusters',
        element: <Cluster />,
        handle: { title: 'Clusters' },
      },
      {
        path: '/settings/users',
        element: <SettingsPage />,
        handle: { title: 'Settings' },
      },
      {
        path: '/settings/variables',
        element: <SettingsPage />,
        handle: { title: 'Settings' },
      },
    ],
  },
  {
    element: <ErrorLayout />,
    children: [
      {
        path: '*',
        element: <NotFound />,
        handle: { title: 'Not Found' },
      },
    ],
  },
]);

export default router;
