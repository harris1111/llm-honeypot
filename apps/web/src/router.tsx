import { createRootRoute, createRoute, createRouter, Outlet, redirect, useRouterState } from '@tanstack/react-router';

import { PageContainer } from './components/layout/page-container';
import { Sidebar } from './components/layout/sidebar';
import { Topbar } from './components/layout/topbar';
import { useAuthStore } from './lib/auth-store';
import { LoginRouteView } from './routes/login';
import { NodeDetailRouteView } from './routes/node-detail';
import { NodesRouteView } from './routes/nodes';
import { OverviewRouteView } from './routes/overview';
import { SettingsRouteView } from './routes/settings';

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

const routeTree = rootRoute.addChildren([loginRoute, overviewRoute, nodesRoute, nodeDetailRoute, settingsRoute]);

export const router = createRouter({
  defaultPreload: 'intent',
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}