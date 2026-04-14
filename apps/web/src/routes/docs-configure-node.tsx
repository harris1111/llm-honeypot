import { PublicDocsLayout } from '../components/public/public-docs-layout';
import { docsConfigureNodePage } from '../content/public-docs';

export function DocsConfigureNodeRouteView() {
  return <PublicDocsLayout page={docsConfigureNodePage} />;
}
