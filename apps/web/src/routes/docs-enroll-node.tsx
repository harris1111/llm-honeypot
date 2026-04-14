import { PublicDocsLayout } from '../components/public/public-docs-layout';
import { docsEnrollNodePage } from '../content/public-docs';

export function DocsEnrollNodeRouteView() {
  return <PublicDocsLayout page={docsEnrollNodePage} />;
}