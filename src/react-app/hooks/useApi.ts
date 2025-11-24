import { useState, useCallback } from "react";

export function useApi<T>(apiFunc: (...args: any[]) => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunc(...args);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  return { execute, loading, error };
}
