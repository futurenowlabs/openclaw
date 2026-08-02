import { Value } from "typebox/value";
import { describe, expect, it } from "vitest";
import { CronRunLogEntrySchema } from "./cron.js";

function entry(assistantCompletion: Record<string, unknown>) {
  return {
    ts: 1,
    jobId: "synthetic-job",
    action: "finished" as const,
    status: "ok" as const,
    summary: "synthetic final",
    assistantCompletion,
  };
}

describe("CronRunLogEntrySchema assistant completion", () => {
  it("preserves the content-free public finality proof", () => {
    expect(
      Value.Check(
        CronRunLogEntrySchema,
        entry({
          contractVersion: "openclaw.cron-assistant-completion.v1",
          toolCallDetected: true,
          toolResultAccepted: true,
          finalAssistantVisible: true,
          finalUserVisibleResult: true,
          toolCallCount: 1,
          toolFailureCount: 0,
          publicTextProjection: "openclaw.cron-summary.trim-utf16-2000-ellipsis.v1",
          publicTextSha256: "a".repeat(64),
        }),
      ),
    ).toBe(true);
  });

  it("rejects malformed or content-bearing finality proof fields", () => {
    expect(
      Value.Check(
        CronRunLogEntrySchema,
        entry({
          contractVersion: "openclaw.cron-assistant-completion.v1",
          toolCallDetected: true,
          toolResultAccepted: false,
          finalAssistantVisible: false,
          finalUserVisibleResult: false,
          toolCallCount: 1,
          toolFailureCount: 1,
          publicTextProjection: "openclaw.cron-summary.trim-utf16-2000-ellipsis.v1",
          publicTextSha256: "a".repeat(64),
          command: "must-not-cross-public-contract",
        }),
      ),
    ).toBe(false);

    expect(
      Value.Check(
        CronRunLogEntrySchema,
        entry({
          contractVersion: "openclaw.cron-assistant-completion.v1",
          toolCallDetected: false,
          toolResultAccepted: false,
          finalAssistantVisible: true,
          finalUserVisibleResult: true,
          toolCallCount: 0,
          toolFailureCount: 0,
          publicTextProjection: "unreviewed-public-projection",
          publicTextSha256: "a".repeat(64),
        }),
      ),
    ).toBe(false);

    expect(
      Value.Check(
        CronRunLogEntrySchema,
        entry({
          contractVersion: "openclaw.cron-assistant-completion.v1",
          toolCallDetected: false,
          toolResultAccepted: false,
          finalAssistantVisible: true,
          finalUserVisibleResult: true,
          toolCallCount: 0,
          toolFailureCount: 0,
          publicTextProjection: "openclaw.cron-summary.trim-utf16-2000-ellipsis.v1",
          publicTextSha256: "not-a-sha256",
        }),
      ),
    ).toBe(false);

    expect(
      Value.Check(
        CronRunLogEntrySchema,
        entry({
          contractVersion: "openclaw.cron-assistant-completion.v1",
          toolCallDetected: false,
          toolResultAccepted: false,
          finalAssistantVisible: true,
          finalUserVisibleResult: true,
          toolCallCount: 0,
          toolFailureCount: 0,
        }),
      ),
    ).toBe(false);
  });
});
