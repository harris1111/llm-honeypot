import { PublicDocsLayout } from '../components/public/public-docs-layout';
import { docsUsingDashboardPage } from '../content/public-docs';

export function DocsUsingDashboardRouteView() {
  return <PublicDocsLayout page={docsUsingDashboardPage} />;
}
