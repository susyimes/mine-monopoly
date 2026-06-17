import type { AiLiveConfig } from "../config";
import type { Logger } from "../logging/logger";
import { checkLocalStack } from "./local-stack";

export async function runPreflight(config: AiLiveConfig, logger: Logger) {
  logger.info("checking local AI live stack");
  const checks = await checkLocalStack(config);
  for (const check of checks) {
    const symbol = check.ok ? "OK" : "FAIL";
    logger.info(`${symbol} ${check.name}`, { detail: check.detail, durationMs: check.durationMs });
  }
  const failed = checks.filter((check) => !check.ok);
  return {
    ok: failed.length === 0,
    checks,
    failed
  };
}

