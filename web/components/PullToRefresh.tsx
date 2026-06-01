'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// Distance (in px) the user must pull past before the refresh triggers
// on release.
const THRESHOLD = 70;

// Visible cap so the indicator never travels arbitrarily far down.
const MAX_PULL = 110;

// Damping factor — actual movement is `delta * RESISTANCE` so the
// indicator drags a little behind the finger and feels weighty.
const RESISTANCE = 0.55;

// How long the refresh indicator sits visibly at THRESHOLD before
// animating back up. Long enough that even snappy refreshes feel
// satisfying.
const HOLD_MS = 600;

// CSS transition duration for the spring-back. Must match the value
// inside the style block below.
const SPRING_MS = 320;

// Wraps the entire app shell. While the user drags down from the top
// of the page the children translate down with the finger and a
// circular refresh indicator drops in from above the header — mirroring
// the native iOS pull-to-refresh feel.
//
// We use `position: relative` + `top` instead of `transform` so that
// `position: fixed` descendants (the bottom tab bar, the floating
// "+ Add" FABs on Home / Collections) stay anchored to the viewport.
// A non-none transform on an ancestor would otherwise turn the
// transformed wrapper into the containing block for any fixed
// children, leaving FABs glued to the bottom of the *content* instead
// of the viewport.
export default function PullToRefresh({
  children,
}: {
  children: React.ReactNode;
}) {
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
      // Only arm the gesture when we're already at the top of the page.
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
      // Suppress the browser's own native pull-to-refresh.
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
        // Hold the indicator visibly at the threshold while we refresh.
        setPhase('refreshing');
        setPull(THRESHOLD);
        router.refresh();
        // Snap the content back after the hold.
        window.setTimeout(() => {
          setPull(0);
        }, HOLD_MS);
        // Transition back to idle once the spring-back finishes.
        window.setTimeout(() => {
          setPhase('idle');
          pullRef.current = 0;
        }, HOLD_MS + SPRING_MS);
      } else {
        // Released below the threshold — spring back without refreshing.
        setPull(0);
        window.setTimeout(() => {
          setPhase('idle');
          pullRef.current = 0;
        }, SPRING_MS);
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

  const progress = Math.min(1, pull / THRESHOLD);
  const triggered = pull >= THRESHOLD;
  // Animate during the spring-back / hold; finger-following moves with
  // no transition so the indicator tracks exactly under the touch.
  const animate = phase !== 'pulling';

  return (
    <div
      style={{
        position: 'relative',
        top: `${pull}px`,
        transition: animate ? `top ${SPRING_MS}ms ease-out` : 'none',
      }}
    >
      {/* Indicator pill — sits absolutely above the page top, so as the
          page slides down it appears in the revealed gap. */}
      <div
        aria-hidden
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
        style={{
          top: `-${THRESHOLD}px`,
          height: `${THRESHOLD}px`,
        }}
      >
        <div
          className="w-11 h-11 rounded-full bg-paper border border-hairline shadow-raised flex items-center justify-center"
          style={{
            opacity: progress,
            transform: `scale(${0.6 + progress * 0.4})`,
            transition: animate ? 'opacity 0.2s, transform 0.2s' : 'none',
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

      {children}
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
