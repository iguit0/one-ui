import { useCallback, useState } from "react";
import { CommonErrorCodes } from "../types";

export default function useAsyncControl<E, F = any>(functionsToWrap?: F) {
  const [error, setError] = useState<E | Error>();
  const [loading, setLoading] = useState<boolean>(false);

  const _process = useCallback(async (asyncFn: () => Promise<any>) => {
    try {
      setLoading(true);
      setError(undefined);
      return await asyncFn();
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.error(e);
      setError(e as E);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    process: _process,
    loading,
    error,
    setError,
    setLoading,
    ...Object.entries(functionsToWrap || {}).reduce((r, [k, func]) => {
      return {
        ...r,
        [k]: (...args: any[]) => _process(() => (func as any)(...args))
      }
    }, {} as F) as F
  };
}
