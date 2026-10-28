import { useEffect, useState } from "react";
import type { Analysis } from "../types";

export function useAnalysis(
  start: string,
  end: string,
  cutoff: string,
  retry: number,
) {
  const [state, setState] = useState<{
    data: Analysis | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    const params = new URLSearchParams({
      start_date: start,
      end_date: end,
      cutoff,
    });
    async function load() {
      try {
        const response = await fetch(`/api/analysis?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(
            typeof payload?.detail === "string"
              ? payload.detail
              : `Data request failed (${response.status}). Please retry.`,
          );
        }
        const data: Analysis = await response.json();
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: null });
      } catch (error) {
        if (!controller.signal.aborted)
          setState({
            data: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Could not load historical data.",
          });
      }
    }
    void load();
    return () => controller.abort();
  }, [start, end, cutoff, retry]);
  return state;
}
