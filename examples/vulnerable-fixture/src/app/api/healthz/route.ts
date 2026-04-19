import { NextResponse } from "next/server";

// Intentionally vulnerable: the health endpoint returns the full process
// environment variable names and the Postgres server version, which discloses
// deployment details to any unauthenticated caller.
export async function GET() {
  return NextResponse.json({
    ok: true,
    envNames: Object.keys(process.env),
    postgresVersion: process.env.PG_VERSION ?? "unknown",
    build: process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown",
  });
}
