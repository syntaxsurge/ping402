"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function scrollToHash({ behavior }: { behavior: ScrollBehavior }) {
  const hash = window.location.hash;
  if (!hash || hash === "#") return;

  const id = decodeURIComponent(hash.slice(1));
  if (!id) return;

  let attempts = 0;
  const maxAttempts = 18;

  const tick = () => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior, block: "start" });
      return;
    }

    attempts += 1;
    if (attempts < maxAttempts) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

export function HashScroller() {
  const pathname = usePathname();

  useEffect(() => {
    scrollToHash({ behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    const onHashChange = () => scrollToHash({ behavior: "smooth" });
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return null;
}
