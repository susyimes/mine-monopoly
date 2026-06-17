import { loadCli } from "./config";
import { createLogger } from "./logging/logger";
import { runPreflight } from "./runner/preflight";

async function main() {
  const { command, config } = loadCli();
  const logger = createLogger({ level: config.logLevel, scope: "ai-live" });

  switch (command) {
    case "stack:check": {
      const result = await runPreflight(config, logger);
      process.exitCode = result.ok ? 0 : 1;
      return;
    }
    case "run:rules": {
      const preflight = await runPreflight(config, logger);
      if (!preflight.ok) {
        throw new Error(`stack:check failed: ${preflight.failed.map((item) => item.name).join(", ")}`);
      }
      const { EventRecorder } = await import("./recorder/event-recorder");
      const { runRulesRoom } = await import("./runner/room-coordinator");
      const recorder = await EventRecorder.create({
        roomId: config.roomId,
        logsRoot: config.runRoot,
        metadata: {
          command,
          botCount: config.botCount,
          humanCount: config.humanCount,
          policy: config.policy,
          headful: config.headful,
          botHeadful: config.botHeadful,
          liveOverlay: config.liveOverlay,
          stallTimeoutMs: config.stallTimeoutMs
        }
      });
      await runRulesRoom(config, logger, recorder);
      return;
    }
    case "test:smoke": {
      const preflight = await runPreflight(config, logger);
      if (!preflight.ok) {
        logger.warn("smoke skipped because local stack is not ready", { failed: preflight.failed.map((item) => item.name) });
        process.exitCode = 1;
        return;
      }
      const { EventRecorder } = await import("./recorder/event-recorder");
      const { runRulesRoom } = await import("./runner/room-coordinator");
      const recorder = await EventRecorder.create({
        roomId: config.roomId,
        logsRoot: config.runRoot,
        metadata: { command, smoke: true }
      });
      await runRulesRoom({ ...config, maxRunMs: Math.min(config.maxRunMs, 180000) }, logger, recorder);
      return;
    }
    case "report:last": {
      try {
        const { formatRunSummary, readLastRunSummary } = await import("./recorder/run-summary");
        const summary = await readLastRunSummary({ logsRoot: config.runRoot });
        console.log(formatRunSummary(summary));
        if (!summary.summary) {
          await logger.warn("no run summary found", { runRoot: config.runRoot });
          process.exitCode = 1;
        }
      } catch (error) {
        await logger.warn("report:last summary reader is not ready in this slice", {
          runRoot: config.runRoot,
          error: error instanceof Error ? error.message : String(error)
        });
        console.log(`report:last is wired. Last-run reporting will read from ${config.runRoot}.`);
        process.exitCode = 1;
      }
      return;
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
