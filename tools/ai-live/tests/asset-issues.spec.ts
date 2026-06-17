import { test, expect } from "@playwright/test";
import { classifyConsoleAssetIssue, classifyPageErrorAssetIssue } from "../src/runner/asset-issues";

test("classifies remote COS asset failures outside pageerror", () => {
  const consoleIssue = classifyConsoleAssetIssue("Bot1", {
    type: "error",
    text: "Failed to load resource: net::ERR_FAILED",
    location: {
      url: "http://fatpaper-1304992673.cos.ap-guangzhou.myqcloud.com/monopoly/models/example.glb"
    }
  });

  expect(consoleIssue).toMatchObject({
    kind: "remote-asset",
    severity: "warning",
    page: "Bot1"
  });

  const pageIssue = classifyPageErrorAssetIssue("Bot2", {
    message: "Failed to fetch",
    stack: "at GLTFLoader http://fatpaper-1304992673.cos.ap-guangzhou.myqcloud.com/monopoly/roles/example.json"
  });

  expect(pageIssue).toMatchObject({
    kind: "remote-asset",
    severity: "warning",
    page: "Bot2"
  });
});

test("classifies static history fallback 404 as informational", () => {
  const issue = classifyConsoleAssetIssue("Host1", {
    type: "error",
    text: "Failed to load resource: the server responded with a status of 404 (File not found)",
    location: { url: "http://localhost/room-router?automation=1" }
  });

  expect(issue).toMatchObject({
    kind: "route-fallback",
    severity: "info"
  });
});
