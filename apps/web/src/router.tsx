import type { ComponentType } from 'react';
import { Suspense, lazy } from 'react';
import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';

import { useAuthStore } from './lib/auth-store';
import { LandingRouteView } from './routes/landing';
import { RepositoryDocsRouteView } from './routes/repository-docs';

function lazyRouteView(loader: () => Promise<{ default: ComponentType<Record<string, never>> }>) {
  const Component = lazy(loader);

  return function LazyRouteView() {
    return (
      <Suspense fallback={<RoutePendingState />}>
        <Component />
      </Suspense>
    );
  };
}

function RoutePendingState() {
  return <div className="rounded-[2rem] border border-stone-800 bg-stone-900/85 px-5 py-6 text-sm text-stone-300">Loading route…</div>;
}

const LoginRouteView = lazyRouteView(() => import('./routes/login').then((module) => ({ default: module.LoginRouteView })));
const DashboardFrame = lazyRouteView(() => import('./components/layout/dashboard-frame').then((module) => ({ default: module.DashboardFrame })));
const OverviewRouteView = lazyRouteView(() => import('./routes/overview').then((module) => ({ default: module.OverviewRouteView })));
const NodesRouteView = lazyRouteView(() => import('./routes/nodes').then((module) => ({ default: module.NodesRouteView })));
const NodeDetailRouteView = lazyRouteView(() => import('./routes/node-detail').then((module) => ({ default: module.NodeDetailRouteView })));
const SessionsRouteView = lazyRouteView(() => import('./routes/sessions').then((module) => ({ default: module.SessionsRouteView })));
const ActorsRouteView = lazyRouteView(() => import('./routes/actors').then((module) => ({ default: module.ActorsRouteView })));
const PersonasRouteView = lazyRouteView(() => import('./routes/personas').then((module) => ({ default: module.PersonasRouteView })));
const ResponseEngineRouteView = lazyRouteView(() => import('./routes/response-engine').then((module) => ({ default: module.ResponseEngineRouteView })));
const AlertsRouteView = lazyRouteView(() => import('./routes/alerts').then((module) => ({ default: module.AlertsRouteView })));
const ThreatIntelRouteView = lazyRouteView(() => import('./routes/threat-intel').then((module) => ({ default: module.ThreatIntelRouteView })));
const LiveFeedRouteView = lazyRouteView(() => import('./routes/live-feed').then((module) => ({ default: module.LiveFeedRouteView })));
const ExportRouteView = lazyRouteView(() => import('./routes/export').then((module) => ({ default: module.ExportRouteView })));
const SettingsRouteView = lazyRouteView(() => import('./routes/settings').then((module) => ({ default: module.SettingsRouteView })));

function requireAuth() {
  if (!useAuthStore.getState().accessToken) {
    throw redirect({ to: '/login' });
  }
}

function redirectAuthenticatedToOverview() {
  if (useAuthStore.getState().accessToken) {
    throw redirect({ to: '/overview' });
  }
}

function RootFrame() {
  return <Outlet />;
}

function PublicFrame() {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <Outlet />
    </main>
  );
}

const rootRoute = createRootRoute({
  component: RootFrame,
});

const publicFrameRoute = createRoute({
  component: PublicFrame,
  getParentRoute: () => rootRoute,
  id: 'public',
});

const dashboardFrameRoute = createRoute({
  beforeLoad: requireAuth,
  component: DashboardFrame,
  getParentRoute: () => rootRoute,
  id: 'dashboard',
});

const landingRoute = createRoute({
  beforeLoad: redirectAuthenticatedToOverview,
  component: LandingRouteView,
  getParentRoute: () => publicFrameRoute,
  path: '/',
});

const repositoryDocsRoute = createRoute({
  component: RepositoryDocsRouteView,
  getParentRoute: () => publicFrameRoute,
  path: '/docs',
});

const loginRoute = createRoute({
  beforeLoad: redirectAuthenticatedToOverview,
  component: LoginRouteView,
  getParentRoute: () => rootRoute,
  path: '/login',
});

const overviewRoute = createRoute({
  component: OverviewRouteView,
  getParentRoute: () => dashboardFrameRoute,
  path: '/overview',
});

const nodesRoute = createRoute({
  component: NodesRouteView,
  getParentRoute: () => dashboardFrameRoute,
  path: '/nodes',
});

const nodeDetailRoute = createRoute({
  component: NodeDetailRouteView,
  getParentRoute: () => dashboardFrameRoute,
  path: '/nodes/$nodeId',
});

const settingsRoute = createRoute({
  component: SettingsRouteView,
  getParentRoute: () => dashboardFrameRoute,
  path: '/settings',
});

const sessionsRoute = createRoute({
  component: SessionsRouteView,
  getParentRoute: () => dashboardFrameRoute,
  path: '/sessions',
});

const actorsRoute = createRoute({
  component: ActorsRouteView,
  getParentRoute: () => dashboardFrameRoute,
  path: '/actors',
});

const personasRoute = createRoute({
  component: PersonasRouteView,
  getParentRoute: () => dashboardFrameRoute,
  path: '/personas',
});

const responseEngineRoute = createRoute({
  component: ResponseEngineRouteView,
  getParentRoute: () => dashboardFrameRoute,
  path: '/response-engine',
});

const alertsRoute = createRoute({
  component: AlertsRouteView,
  getParentRoute: () => dashboardFrameRoute,
  path: '/alerts',
});

const threatIntelRoute = createRoute({
  component: ThreatIntelRouteView,
  getParentRoute: () => dashboardFrameRoute,
  path: '/threat-intel',
});

const exportRoute = createRoute({
  component: ExportRouteView,
  getParentRoute: () => dashboardFrameRoute,
  path: '/export',
});

const liveFeedRoute = createRoute({
  component: LiveFeedRouteView,
  getParentRoute: () => dashboardFrameRoute,
  path: '/live-feed',
});

const routeTree = rootRoute.addChildren([
  publicFrameRoute.addChildren([landingRoute, repositoryDocsRoute]),
  dashboardFrameRoute.addChildren([
    overviewRoute,
    nodesRoute,
    nodeDetailRoute,
    sessionsRoute,
    actorsRoute,
    personasRoute,
    responseEngineRoute,
    alertsRoute,
    threatIntelRoute,
    liveFeedRoute,
    exportRoute,
    settingsRoute,
  ]),
  loginRoute,
]);

export const router = createRouter({
  defaultPreload: 'intent',
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}