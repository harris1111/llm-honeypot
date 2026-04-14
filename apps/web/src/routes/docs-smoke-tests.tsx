import { PublicDocsLayout } from '../components/public/public-docs-layout';
import { docsSmokeTestsPage } from '../content/public-docs';

export function DocsSmokeTestsRouteView() {
  return <PublicDocsLayout page={docsSmokeTestsPage} />;
}