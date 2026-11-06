/**
 * GET /api/health — liveness only. Safe to expose publicly and to point an external
 * uptime monitor (UptimeRobot, Better Stack, ...) at. Reports nothing about integrations.
 * Deeper diagnostics live behind a secret at /api/ready.
 */
import { defineEventHandler, setResponseHeader } from "h3";

const STARTED_AT = Date.now();

export default defineEventHandler((event) => {
  setResponseHeader(event, "cache-control", "no-store");
  return {
    status: "ok",
    uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000),
  };
});
