"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** Final value to count to */
  value: number;
  /** Animation duration in ms */
  durationMs?: number;
  /** Rendered before the number, e.g. "$" */
  prefix?: string;
  /** Rendered after the number, e.g. "+" or " psf" */
  suffix?: string;
  /** Decimal places */
  decimals?: number;
  /** Use thousands separators (en-SG). Default true. */
  group?: boolean;
  className?: string;
}

// Signature SGHaus motion: numbers "calculate" into place. Tabular figures mean
// zero layout shift while counting. Honors reduced-motion by rendering the final
// value instantly, and only starts once the number is on screen.
export default function CountUp({
  value,
  durationMs = 900,
  prefix = "",
  suffix = "",
  decimals = 0,
  group = true,
  className = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Reduced motion snaps to the final value on the first frame instead of
    // animating. Routing it through the same rAF path (rather than a synchronous
    // setState in the effect body) keeps the render cycle clean.
    const dur = prefersReduced ? 0 : durationMs;

    let rafId = 0;
    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const easeOutExpo = (t: number) =>
        t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

      const tick = (now: number) => {
        const t = dur === 0 ? 1 : Math.min((now - start) / dur, 1);
        setDisplay(value * easeOutExpo(t));
        if (t < 1) rafId = requestAnimationFrame(tick);
        else setDisplay(value);
      };
      rafId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);

    // Fallback: never leave the number resting at 0 if the observer doesn't fire
    // (e.g. headless capture, odd scroll containers). Guarantees it reaches value.
    const fallback = window.setTimeout(run, 1400);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      clearTimeout(fallback);
    };
  }, [value, durationMs]);

  const formatted = group
    ? display.toLocaleString("en-SG", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : display.toFixed(decimals);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
