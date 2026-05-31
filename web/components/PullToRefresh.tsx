'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// Distance (in px) the user must pull past before the refresh triggers
// on release.
const THRESHOLD = 70;

// Visible cap so the indicator never travels arbitrarily far down.
const MAX_PULL = 120;

// Damping factor — actual movement is `delta * RESISTANCE` so the
// indicator drags a little behind the finger and feels weighty.
const RESISTANCE = 0.55;

export default function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'pulling' | 'refreshing'>(
    'idle',
  );
  const router = useRouter();
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (phase === 'refreshing') return;
      // Only arm the gesture when we're already at the top of the page —
      // otherwise pull-down is just a normal scroll.
      if (window.scrollY > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      if (phase === 'refreshing') return;
      const current = e.touches[0]?.clientY ?? startY.current;
      const delta = current - startY.current;
      if (delta <= 0) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      // Prevent the browser's own pull-to-refresh chrome from firing.
      if (e.cancelable) e.preventDefault();
      const eased = Math.min(MAX_PULL, delta * RESISTANCE);
      pullRef.current = eased;
      setPull(eased);
      setPhase('pulling');
    };

    const onTouchEnd = () => {
      if (startY.current === null) return;
      const reached = pullRef.current >= THRESHOLD;
      startY.current = null;
      if (reached) {
        setPhase('refreshing');
        setPull(THRESHOLD);
        router.refresh();
        // Dismiss the spinner after a short hold so the user sees it
        // even on snappy refreshes. The actual fetch happens in
        // router.refresh() above.
        window.setTimeout(() => {
          setPhase('idle');
          setPull(0);
          pullRef.current = 0;
        }, 750);
      } else {
        setPhase('idle');
        setPull(0);
        pullRef.current = 0;
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [phase, router]);

  const visible = pull > 0 || phase === 'refreshing';
  const progress = Math.min(1, pull / THRESHOLD);
  const triggered = pull >= THRESHOLD;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        pointerEvents: 'none',
        transform: `translateY(${visible ? Math.min(pull, MAX_PULL) - 56 : -56}px)`,
        transition:
          phase === 'idle' || phase === 'refreshing'
            ? 'transform 0.25s ease-out'
            : 'none',
      }}
      className="flex items-center justify-center pt-2"
    >
      <div
        className="w-11 h-11 rounded-full bg-paper border border-hairline shadow-raised flex items-center justify-center"
        style={{
          // Subtle scale-in as you start pulling
          transform: `scale(${0.7 + progress * 0.3})`,
        }}
      >
        <span
          className={
            phase === 'refreshing'
              ? 'text-forest animate-spin'
              : triggered
                ? 'text-forest'
                : 'text-gold-deep'
          }
          style={{
            display: 'inline-flex',
            transform:
              phase === 'refreshing'
                ? undefined
                : `rotate(${progress * 270}deg)`,
            transition: phase === 'pulling' ? 'none' : 'transform 0.15s',
          }}
        >
          <RefreshIcon />
        </span>
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </svg>
  );
}
