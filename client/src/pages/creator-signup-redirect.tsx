import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Backwards-compatible route: /creator-signup
 * Canonical route: /signup/creator
 */
export default function CreatorSignupRedirectPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Replace the URL in-place so shared links converge on the canonical route.
    try {
      const { pathname, search, hash } = window.location;
      if (pathname === "/creator-signup") {
        window.history.replaceState(null, "", `/signup/creator${search}${hash}`);
      }
    } catch {
      // noop
    }

    setLocation("/signup/creator");
  }, [setLocation]);

  return null;
}


