import { useEffect, useState } from "react";

/** Viewport ≤ 90rem (~1440px CSS) — PDF modal compact layout */
const COMPACT_MQ = "(max-width: 90rem)";

export function useCompactViewport(): boolean {
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia(COMPACT_MQ).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_MQ);
    const onChange = () => setCompact(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return compact;
}
