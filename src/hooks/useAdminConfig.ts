import { useCallback, useEffect, useState } from "react";
import type { AdminConfig, AdminConfigUpdate } from "../api/adminConfig";
import { getAdminConfig, updateAdminConfig } from "../api/adminConfig";

export function useAdminConfig() {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getAdminConfig();
        if (mounted) {
          setConfig(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError((err as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const saveConfig = useCallback(async (updates: AdminConfigUpdate) => {
    const next = await updateAdminConfig(updates);
    setConfig(next);
    return next;
  }, []);

  return { config, loading, error, saveConfig };
}
