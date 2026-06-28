import { useEffect, useRef, useState } from "react";

/** Splits "50K+" → prefix "", number 50, suffix "K+"; "4.9★" → 4.9 + "★". */
function parseStat(value: string) {
  const match = value.match(/^(\D*)([\d.,]+)(.*)$/);
  if (!match) return { prefix: "", target: null as number | null, suffix: value, decimals: 0 };
  const [, prefix, num, suffix] = match;
  const clean = num.replace(/,/g, "");
  const decimals = clean.includes(".") ? clean.split(".")[1].length : 0;
  return { prefix, target: Number.parseFloat(clean), suffix, decimals };
}

/** Animates a stat string (e.g. "50K+", "98%", "4.9★") counting up when scrolled into view. */
export function CountUp({
  value,
  className,
  duration = 1600,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const { prefix, target, suffix, decimals } = parseStat(value);
  const [display, setDisplay] = useState(target === null ? value : `${prefix}0${suffix}`);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (target === null) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const finalText = `${prefix}${target.toFixed(decimals)}${suffix}`;
    if (reduce) {
      setDisplay(finalText);
      return;
    }

    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setDisplay(`${prefix}${(target * eased).toFixed(decimals)}${suffix}`);
        if (t < 1) requestAnimationFrame(tick);
        else setDisplay(finalText);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
