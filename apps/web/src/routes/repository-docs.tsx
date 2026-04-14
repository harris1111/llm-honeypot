import { PublicDocsLayout } from '../components/public/public-docs-layout';
import { docsOverviewPage } from '../content/public-docs';

export function DocsRouteView() {
  return <PublicDocsLayout page={docsOverviewPage} />;
}