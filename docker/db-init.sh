#!/bin/sh
set -eu

MIGRATION_NAME="20260413_initial"

db_state=$(pnpm --filter @llmtrap/db exec node <<'NODE'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    WITH public_tables AS (
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    ),
    expected_tables AS (
      SELECT unnest(ARRAY[
        'Actor',
        'AlertLog',
        'AlertRule',
        'AuditLog',
        'BudgetEntry',
        'CapturedRequest',
        'HoneypotSession',
        'IpEnrichment',
        'Node',
        'Persona',
        'ResponseTemplate',
        'User',
        'UserSession'
      ]) AS table_name
    )
    SELECT CASE
      WHEN EXISTS (
        SELECT 1
        FROM public_tables
        WHERE table_name = '_prisma_migrations'
      ) THEN 'has_migrations'
      WHEN NOT EXISTS (
        SELECT 1
        FROM public_tables
        WHERE table_name <> '_prisma_migrations'
      ) THEN 'empty'
      WHEN (
        SELECT COUNT(*)
        FROM expected_tables
        INNER JOIN public_tables USING (table_name)
      ) = (
        SELECT COUNT(*) FROM expected_tables
      ) AND NOT EXISTS (
        SELECT 1
        FROM public_tables
        WHERE table_name <> '_prisma_migrations'
          AND table_name NOT IN (SELECT table_name FROM expected_tables)
      ) THEN 'needs_baseline'
      ELSE 'unexpected_nonempty'
    END AS state
  `);

  process.stdout.write(rows[0].state);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
NODE
)

if [ "$db_state" = "needs_baseline" ]; then
  echo "Existing schema detected without migration history; marking ${MIGRATION_NAME} as applied"
  pnpm --filter @llmtrap/db prisma migrate resolve --applied "$MIGRATION_NAME"
elif [ "$db_state" = "unexpected_nonempty" ]; then
  echo "Refusing to baseline a non-empty database that does not match the legacy full schema"
  exit 1
fi

pnpm --filter @llmtrap/db prisma migrate deploy
pnpm --filter @llmtrap/db seed