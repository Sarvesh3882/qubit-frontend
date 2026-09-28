"use client";
import { useEffect } from "react";
import { useAgentStore } from "@/store/agentStore";

/**
 * Call this hook at the top of any page that has learning context.
 * It sets the agent's context so responses are grounded in what the user is doing.
 */
export function useSetAgentContext(ctx: Parameters<ReturnType<typeof useAgentStore.getState>["setContext"]>[0]) {
  const setContext = useAgentStore((s) => s.setContext);
  useEffect(() => {
    setContext(ctx);
    return () => {
      // Clear context-specific fields when leaving the page
      setContext({
        lesson_id: undefined,
        lesson_title: undefined,
        module_id: undefined,
        module_title: undefined,
        current_code: undefined,
        simulation_result: undefined,
        current_concept: undefined,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(ctx)]);
}
