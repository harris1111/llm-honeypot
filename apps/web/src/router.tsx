import { createRootRoute, createRoute, createRouter, Outlet, redirect, useRouterState } from '@tanstack/react-router';

import { PageContainer } from './components/layout/page-container';
import { Sidebar } from './components/layout/sidebar';
import { Topbar } from './components/layout/topbar';
import { useAuthStore } from './lib/auth-store';
import { AlertsRouteView } from './routes/alerts';
import { ActorsRouteView } from './routes/actors';
import { ExportRouteView } from './routes/export';
import { LoginRouteView } from './routes/login';
import { LiveFeedRouteView } from './routes/live-feed';
import { NodeDetailRouteView } from './routes/node-detail';
import { NodesRouteView } from './routes/nodes';
import { OverviewRouteView } from './routes/overview';
import { PersonasRouteView } from './routes/personas';
import { SessionsRouteView } from './routes/sessions';
import { SettingsRouteView } from './routes/settings';
import { ThreatIntelRouteView } from './routes/threat-intel';

function requireAuth() {
  if (!useAuthStore.getState().accessToken) {
    throw redirect({ to: '/login' });
  }
}

function AppFrame() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname === '/login') {
    return <Outlet />;
  }

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-6 text-stone-100 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row">
        <Sidebar />
        <div className="min-w-0 flex-1 space-y-4">
          <Topbar />
          <PageContainer>
            <Outlet />
          </PageContainer>
        </div>
      </div>
    </main>
  );
}

const rootRoute = createRootRoute({
  component: AppFrame,
});

const loginRoute = createRoute({
  component: LoginRouteView,
  getParentRoute: () => rootRoute,
  path: '/login',
});

const overviewRoute = createRoute({
  beforeLoad: requireAuth,
  component: OverviewRouteView,
  getParentRoute: () => rootRoute,
  path: '/',
});

const nodesRoute = createRoute({
  beforeLoad: requireAuth,
  component: NodesRouteView,
  getParentRoute: () => rootRoute,
  path: '/nodes',
});

const nodeDetailRoute = createRoute({
  beforeLoad: requireAuth,
  component: NodeDetailRouteView,
  getParentRoute: () => rootRoute,
  path: '/nodes/$nodeId',
});

const settingsRoute = createRoute({
  beforeLoad: requireAuth,
  component: SettingsRouteView,
  getParentRoute: () => rootRoute,
  path: '/settings',
});

const sessionsRoute = createRoute({
  beforeLoad: requireAuth,
  component: SessionsRouteView,
  getParentRoute: () => rootRoute,
  path: '/sessions',
});

const actorsRoute = createRoute({
  beforeLoad: requireAuth,
  component: ActorsRouteView,
  getParentRoute: () => rootRoute,
  path: '/actors',
});

const personasRoute = createRoute({
  beforeLoad: requireAuth,
  component: PersonasRouteView,
  getParentRoute: () => rootRoute,
  path: '/personas',
});

const alertsRoute = createRoute({
  beforeLoad: requireAuth,
  component: AlertsRouteView,
  getParentRoute: () => rootRoute,
  path: '/alerts',
});

const threatIntelRoute = createRoute({
  beforeLoad: requireAuth,
  component: ThreatIntelRouteView,
  getParentRoute: () => rootRoute,
  path: '/threat-intel',
});

const exportRoute = createRoute({
  beforeLoad: requireAuth,
  component: ExportRouteView,
  getParentRoute: () => rootRoute,
  path: '/export',
});

const liveFeedRoute = createRoute({
  beforeLoad: requireAuth,
  component: LiveFeedRouteView,
  getParentRoute: () => rootRoute,
  path: '/live-feed',
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  overviewRoute,
  nodesRoute,
  nodeDetailRoute,
  sessionsRoute,
  actorsRoute,
  personasRoute,
  alertsRoute,
  threatIntelRoute,
  liveFeedRoute,
  exportRoute,
  settingsRoute,
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