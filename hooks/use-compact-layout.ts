"use client";

import { useEffect, useState } from "react";

export function useCompactLayout(maxWidth = 640) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const sync = () => setIsCompact(mediaQuery.matches);

    sync();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", sync);

      return () => {
        mediaQuery.removeEventListener("change", sync);
      };
    }

    mediaQuery.addListener(sync);

    return () => {
      mediaQuery.removeListener(sync);
    };
  }, [maxWidth]);

  return isCompact;
}