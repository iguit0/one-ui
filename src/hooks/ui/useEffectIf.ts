import { useEffect } from "react";

export default function useEffectIf(
  effect: Parameters<typeof useEffect>[0],
  depsToCheck: any[]
) {
  useEffect(() => {
    const someUndefined = depsToCheck.some((dep) => !dep);
    if (!someUndefined) return effect();
  }, depsToCheck);
}
