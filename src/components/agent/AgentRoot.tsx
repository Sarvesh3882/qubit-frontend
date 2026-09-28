"use client";
import AgentButton from "./AgentButton";
import AgentPanel from "./AgentPanel";

/**
 * AgentRoot mounts both the floating button and the slide-in panel.
 * Placed once in the root layout so the agent is available on every page.
 */
export default function AgentRoot() {
  return (
    <>
      <AgentPanel />
      <AgentButton />
    </>
  );
}
