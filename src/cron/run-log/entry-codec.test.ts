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
});
