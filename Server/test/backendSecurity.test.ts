import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../src/app";
import { isAllowedImage } from "../src/middlewares/secureUploads";
import { createCsv, parseReportDateRange } from "../src/utils/reporting";

let server: ReturnType<typeof app.listen>;
let baseUrl = "";

before(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("report date range includes the complete end date", () => {
  const range = parseReportDateRange("2026-01-01", "2026-01-31");
  assert.ok(range);
  assert.equal(range.from.toISOString(), "2026-01-01T00:00:00.000Z");
  assert.equal(range.to.toISOString(), "2026-02-01T00:00:00.000Z");
});

test("report date range rejects invalid calendar dates and oversized ranges", () => {
  assert.equal(parseReportDateRange("2026-02-30", "2026-03-01"), null);
  assert.equal(parseReportDateRange("2024-01-01", "2025-01-02"), null);
  assert.equal(parseReportDateRange(["2026-01-01"], "2026-01-02"), null);
});

test("default report range covers the last 365 complete UTC dates", () => {
  const range = parseReportDateRange(undefined, undefined, new Date("2026-01-15T17:30:00.000Z"));
  assert.ok(range);
  assert.equal(range.from.toISOString(), "2025-01-16T00:00:00.000Z");
  assert.equal(range.to.toISOString(), "2026-01-16T00:00:00.000Z");
});

test("CSV output escapes cells and blocks spreadsheet formulas", () => {
  const csv = createCsv(["name", "note"], [
    { name: "  =1+1", note: 'say "hi"' },
  ]);
  assert.equal(csv, `"name","note"\r\n"'  =1+1","say ""hi"""`);
});

test("image upload validation checks file signatures and declared types", () => {
  assert.equal(isAllowedImage("image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0x00])), true);
  assert.equal(isAllowedImage("image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), true);
  assert.equal(isAllowedImage("image/webp", Buffer.from("RIFF0000WEBP")), true);
  assert.equal(isAllowedImage("image/png", Buffer.from("<svg></svg>")), false);
  assert.equal(isAllowedImage("image/svg+xml", Buffer.from("<svg></svg>")), false);
});

test("API responses include security headers and a request ID", async () => {
  const response = await fetch(`${baseUrl}/not-a-route`);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.ok(response.headers.get("x-request-id"));
  const body = await response.json() as { success: boolean; requestId: string };
  assert.equal(body.success, false);
  assert.equal(body.requestId, response.headers.get("x-request-id"));
});

test("authentication endpoints validate input before touching the database", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", password: "DO_NOT_ECHO_THIS" }),
  });
  assert.equal(response.status, 400);
  const body = await response.json() as { success: boolean; errors?: unknown[] };
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.errors));
  assert.equal(JSON.stringify(body).includes("DO_NOT_ECHO_THIS"), false);
});

test("analytics routes require an admin session", async () => {
  const response = await fetch(`${baseUrl}/api/analytics/overview`);
  assert.equal(response.status, 401);
  const body = await response.json() as { success: boolean; message: string };
  assert.equal(body.success, false);
  assert.equal(body.message, "Authentication required");
});

test("CORS rejects origins outside the configured allowlist", async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { Origin: "https://not-allowed.example" },
  });
  assert.equal(response.status, 403);
  const body = await response.json() as { success: boolean; message: string };
  assert.equal(body.success, false);
});
