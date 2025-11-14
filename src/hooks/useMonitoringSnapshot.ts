import { useEffect, useState } from "react";
import type { MonitoringSnapshot } from "../api/adminConfig";
import { getMonitoringSnapshot } from "../api/adminConfig";

export function useMonitoringSnapshot() {
  const [snapshot, setSnapshot] = useState<MonitoringSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getMonitoringSnapshot();
        if (active) {
          setSnapshot(data);
          setError(null);
        }
      } catch (err) {
        if (active) setError((err as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { snapshot, loading, error };
}
