import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildCronAssistantCompletion } from "./assistant-completion.js";
import { resolveCronPayloadOutcome } from "./helpers.js";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim()).digest("hex");
}

function buildResult(params: {
  text?: string;
  stopReason?: string;
  calls?: number;
  failures?: number;
  pending?: number;
  isError?: boolean;
  finalAssistantVisible?: boolean;
}) {
  return {
    payloads: params.text === undefined ? [] : [{ text: params.text, isError: params.isError }],
    meta: {
      durationMs: 1,
      finalAssistantVisibleText: params.finalAssistantVisible === false ? undefined : params.text,
      stopReason: params.stopReason,
      toolSummary: {
        calls: params.calls ?? 0,
        tools: params.calls ? ["exec"] : [],
        failures: params.failures ?? 0,
      },
      pendingToolCalls: Array.from({ length: params.pending ?? 0 }, (_, index) => ({
        id: `call-${index}`,
        name: "exec",
        arguments: "sensitive fixture argument",
      })),
    },
  };
}

describe("buildCronAssistantCompletion", () => {
  it("admits ordinary final assistant text without tool activity", () => {
    expect(
      buildCronAssistantCompletion(buildResult({ text: "Public summary", stopReason: "stop" })),
    ).toEqual({
      contractVersion: "openclaw.cron-assistant-completion.v1",
      toolCallDetected: false,
      toolResultAccepted: false,
      finalAssistantVisible: true,
      finalUserVisibleResult: true,
      toolCallCount: 0,
      toolFailureCount: 0,
      finalAssistantVisibleTextSha256: sha256("Public summary"),
    });
  });

  it("proves a completed tool result followed by final assistant text", () => {
    const completion = buildCronAssistantCompletion(
      buildResult({ text: "Final summary", stopReason: "stop", calls: 1 }),
    );
    expect(completion).toMatchObject({
      toolCallDetected: true,
      toolResultAccepted: true,
      finalAssistantVisible: true,
      finalUserVisibleResult: true,
      toolCallCount: 1,
      toolFailureCount: 0,
      finalAssistantVisibleTextSha256: sha256("Final summary"),
    });
  });

  it("admits an explicit final assistant continuation after a settled failed tool result", () => {
    const completion = buildCronAssistantCompletion(
      buildResult({ text: "Safe final answer", stopReason: "stop", calls: 1, failures: 1 }),
    );
    expect(completion.finalUserVisibleResult).toBe(true);
    expect(completion.toolResultAccepted).toBe(true);
    expect(completion.toolFailureCount).toBe(1);
    expect(completion.finalAssistantVisibleTextSha256).toBe(sha256("Safe final answer"));
  });

  it("rejects a pending tool call without a final continuation and emits no tool details", () => {
    const completion = buildCronAssistantCompletion(
      buildResult({ text: "intermediate", stopReason: "tool_calls", calls: 1, pending: 1 }),
    );
    expect(completion.finalUserVisibleResult).toBe(false);
    expect(completion.toolResultAccepted).toBe(false);
    expect(completion.finalAssistantVisibleTextSha256).toBeUndefined();
    expect(JSON.stringify(completion)).not.toContain("sensitive fixture argument");
    expect(JSON.stringify(completion)).not.toContain("call-0");
  });

  it("admits a final assistant turn after earlier completed tool activity", () => {
    const completion = buildCronAssistantCompletion(
      buildResult({ text: "Final user-visible answer", stopReason: "stop", calls: 2 }),
    );
    expect(completion.finalUserVisibleResult).toBe(true);
    expect(completion.toolResultAccepted).toBe(true);
  });

  it("rejects structured error payloads without an explicit final assistant continuation", () => {
    const completion = buildCronAssistantCompletion(
      buildResult({
        text: "ordinary-looking text",
        stopReason: "stop",
        calls: 1,
        failures: 1,
        isError: true,
        finalAssistantVisible: false,
      }),
    );
    expect(completion.finalUserVisibleResult).toBe(false);
    expect(completion.toolResultAccepted).toBe(false);
    expect(completion.finalAssistantVisibleTextSha256).toBeUndefined();
  });

  it("keeps the explicit final hash distinct when public fallback text differs", () => {
    const finalText = "Explicit safe final";
    const completion = buildCronAssistantCompletion(
      buildResult({ text: finalText, stopReason: "stop", calls: 1, failures: 1 }),
    );
    const publicOutcome = resolveCronPayloadOutcome({
      payloads: [{ text: "same-shape intermediate tool result" }],
      finalAssistantVisibleText: finalText,
      preferFinalAssistantVisibleText: false,
    });

    expect(publicOutcome.outputText).toBe("same-shape intermediate tool result");
    expect(completion.finalAssistantVisibleTextSha256).toBe(sha256(finalText));
    expect(completion.finalAssistantVisibleTextSha256).not.toBe(
      sha256(publicOutcome.outputText ?? ""),
    );
  });
});
