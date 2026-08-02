import { describe, expect, it } from "vitest";
import { parseCronRunLogEntryObject } from "./entry-codec.js";

describe("parseCronRunLogEntryObject assistant completion", () => {
  it("preserves only the bounded public assistant completion contract", () => {
    const result = parseCronRunLogEntryObject({
      ts: 1,
      jobId: "fixture-job",
      action: "finished",
      status: "ok",
      assistantCompletion: {
        contractVersion: "openclaw.cron-assistant-completion.v1",
        toolCallDetected: true,
        toolResultAccepted: true,
        finalAssistantVisible: true,
        finalUserVisibleResult: true,
        toolCallCount: 1,
        toolFailureCount: 0,
        publicTextProjection: "openclaw.cron-summary.trim-utf16-2000-ellipsis.v1",
        publicTextSha256: "a".repeat(64),
        privateDetail: "must-not-survive",
      },
    });

    expect(result?.assistantCompletion).toEqual({
      contractVersion: "openclaw.cron-assistant-completion.v1",
      toolCallDetected: true,
      toolResultAccepted: true,
      finalAssistantVisible: true,
      finalUserVisibleResult: true,
      toolCallCount: 1,
      toolFailureCount: 0,
      publicTextProjection: "openclaw.cron-summary.trim-utf16-2000-ellipsis.v1",
      publicTextSha256: "a".repeat(64),
    });
    expect(JSON.stringify(result?.assistantCompletion)).not.toContain("privateDetail");
  });

  it("drops malformed assistant completion evidence", () => {
    const result = parseCronRunLogEntryObject({
      ts: 1,
      jobId: "fixture-job",
      action: "finished",
      status: "ok",
      assistantCompletion: {
        contractVersion: "openclaw.cron-assistant-completion.v1",
        toolCallDetected: true,
        toolResultAccepted: true,
        finalAssistantVisible: true,
        finalUserVisibleResult: true,
        toolCallCount: 1,
        toolFailureCount: 2,
      },
    });

    expect(result?.assistantCompletion).toBeUndefined();
  });

  it("drops visible completion evidence without an exact text binding", () => {
    const result = parseCronRunLogEntryObject({
      ts: 1,
      jobId: "fixture-job",
      action: "finished",
      status: "ok",
      assistantCompletion: {
        contractVersion: "openclaw.cron-assistant-completion.v1",
        toolCallDetected: false,
        toolResultAccepted: false,
        finalAssistantVisible: true,
        finalUserVisibleResult: true,
        toolCallCount: 0,
        toolFailureCount: 0,
      },
    });

    expect(result?.assistantCompletion).toBeUndefined();
  });

  it("drops visible completion evidence for an unreviewed public projection", () => {
    const result = parseCronRunLogEntryObject({
      ts: 1,
      jobId: "fixture-job",
      action: "finished",
      status: "ok",
      assistantCompletion: {
        contractVersion: "openclaw.cron-assistant-completion.v1",
        toolCallDetected: false,
        toolResultAccepted: false,
        finalAssistantVisible: true,
        finalUserVisibleResult: true,
        toolCallCount: 0,
        toolFailureCount: 0,
        publicTextProjection: "unreviewed-public-projection",
        publicTextSha256: "a".repeat(64),
      },
    });

    expect(result?.assistantCompletion).toBeUndefined();
  });
});
