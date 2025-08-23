import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storeTranscriptChunk = mutation({
  args: {
    runId: v.id("runs"),
    speaker: v.union(v.literal("agent"), v.literal("customer")),
    text: v.string(),
    timestamp: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("trace_items", {
      runId: args.runId,
      ts: args.timestamp,
      tool: "transcript.chunk",
      input: { speaker: args.speaker, text: args.text },
      output: {},
      status: "ok",
      policyMsg: undefined,
    });
    return null;
  },
});

export const getLiveTranscript = query({
  args: { runId: v.id("runs") },
  returns: v.array(
    v.object({
      speaker: v.union(v.literal("agent"), v.literal("customer")),
      text: v.string(),
      time: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const chunks = await ctx.db
      .query("trace_items")
      .withIndex("by_run_tool_ts", (q) =>
        q.eq("runId", args.runId).eq("tool", "transcript.chunk")
      )
      .collect();

    return chunks.map((c) => ({
      speaker: c.input?.speaker,
      text: c.input?.text,
      time: new Date(c.ts).toLocaleTimeString(),
    }));
  },
});

