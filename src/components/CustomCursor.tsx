import { useEffect, useRef, useState } from 'react';

/**
 * Brutalist crosshair cursor with smoothed trailing ring.
 * Pointer-events disabled so it never interferes with clicks.
 */
export const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Skip on touch / coarse pointer devices
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    setEnabled(true);

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: target.x, y: target.y };
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
      }
    };

    const onDown = () => ringRef.current?.classList.add('cursor-active');
    const onUp = () => ringRef.current?.classList.remove('cursor-active');

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const interactive = t?.closest('a, button, input, textarea, select, [role="button"]');
      ringRef.current?.classList.toggle('cursor-hover', !!interactive);
    };

    const tick = () => {
      ring.x += (target.x - ring.x) * 0.18;
      ring.y += (target.y - ring.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseover', onOver);
    document.documentElement.classList.add('custom-cursor-active');

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseover', onOver);
      document.documentElement.classList.remove('custom-cursor-active');
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Outer crosshair ring */}
      <div
        ref={ringRef}
        className="custom-cursor-ring pointer-events-none fixed top-0 left-0 z-[9999] w-9 h-9 border border-foreground"
      >
        {/* Crosshair lines */}
        <span className="absolute top-1/2 left-[-6px] w-2 h-px bg-foreground" />
        <span className="absolute top-1/2 right-[-6px] w-2 h-px bg-foreground" />
        <span className="absolute left-1/2 top-[-6px] h-2 w-px bg-foreground" />
        <span className="absolute left-1/2 bottom-[-6px] h-2 w-px bg-foreground" />
      </div>
      {/* Inner dot */}
      <div
        ref={dotRef}
        className="custom-cursor-dot pointer-events-none fixed top-0 left-0 z-[9999] w-1 h-1 bg-foreground"
      />
    </>
  );
};
