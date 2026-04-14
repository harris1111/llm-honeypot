import { PublicDocsLayout } from '../components/public/public-docs-layout';
import { docsGettingStartedPage } from '../content/public-docs';

export function DocsGettingStartedRouteView() {
  return <PublicDocsLayout page={docsGettingStartedPage} />;
}