#!/usr/bin/env bun
/**
 * CreatorOS — Database Migration Runner
 *
 * Applies migration SQL files in order, then seeds demo data.
 *
 * Usage:
 *   bun run src/db/migrate.ts          # Run migrations + seed
 *   bun run src/db/migrate.ts migrate  # Run migrations only
 *   bun run src/db/migrate.ts seed     # Run seed data only
 *
 * Requires DATABASE_URL to be set in the environment.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const mode = process.argv[2] ?? "all";
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error("❌ DATABASE_URL is not set. Connect a database first.");
    process.exit(1);
  }

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);

  const runSqlFile = async (label: string, filePath: string) => {
    if (!filePath.endsWith(".sql")) return;
    console.log(`\n📦 ${label}: ${filePath.split("/").pop()}`);
    const content = readFileSync(filePath, "utf8");
    const statements = content
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await sql(stmt + ";");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Ignore "already exists" type errors for idempotency
        if (
          msg.includes("already exists") ||
          msg.includes("duplicate key") ||
          msg.includes("unique constraint")
        ) {
          console.log(`  ⚡ Skipped (already applied): ${stmt.slice(0, 80)}...`);
        } else {
          console.error(`  ❌ Error on: ${stmt.slice(0, 120)}...`);
          console.error(`     ${msg}`);
          throw err;
        }
      }
    }
    console.log(`  ✅ Applied ${statements.length} statement(s)`);
  };

  // --- Run migrations ---
  if (mode === "all" || mode === "migrate") {
    const migrationsDir = join(__dirname, "migrations");
    const files = readdirSync(migrationsDir).sort();
    for (const file of files) {
      await runSqlFile("Migration", join(migrationsDir, file));
    }
  }

  // --- Run seeds ---
  if (mode === "all" || mode === "seed") {
    const seedDir = join(__dirname, "seed");
    const files = readdirSync(seedDir).sort();
    for (const file of files) {
      await runSqlFile("Seed", join(seedDir, file));
    }
  }

  console.log("\n✅ Database setup complete.");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});