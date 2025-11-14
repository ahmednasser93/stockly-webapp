import { useEffect, useState } from "react";
import { fetchOpenApiSpec } from "../api/adminConfig";

export function useOpenApiSpec() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchOpenApiSpec();
        if (mounted) {
          if (!data.openapi) {
            data.openapi = "3.0.0";
          }
          setSpec(data);
        }
      } catch (err) {
        if (mounted) setError((err as Error).message);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { spec, error };
}
