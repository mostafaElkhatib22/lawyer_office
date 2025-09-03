// src/hooks/use-media-query.ts
import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // التحقق من وجود window (لأن الهوك ده بيشتغل على الـ client side بس)
    if (typeof window === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQueryList.matches); // Set initial state

    mediaQueryList.addEventListener("change", listener); // Add listener
    return () => {
      mediaQueryList.removeEventListener("change", listener); // Clean up
    };
  }, [query]);

  return matches;
}
