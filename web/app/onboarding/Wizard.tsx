'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { ArchetypeDef, FocusDef, SubCategory } from '@/lib/onboarding';
import { ARCHETYPE_SUBCATEGORIES } from '@/lib/onboarding';
import type { OnboardingArchetype, OnboardingFocus } from '@/lib/types';
import { completeOnboarding, skipOnboarding } from './actions';

type CollectionOption = {
  key: string;
  label: string;
  glyph: string;
  iconUrl: string | null;
};

type Step = 'archetype' | 'collections' | 'focus' | 'reveal';

interface WizardProps {
  archetypes: ArchetypeDef[];
  focusModes: FocusDef[];
  allCollections: CollectionOption[];
}

const REVEAL_DURATION_MS = 2400;

// Single source of truth for the cream-to-image gradient that overlays
// every card with a background photo (archetype cards in Step 1 + the
// sub-category cards in Step 2). Keeping it shared so every card reads
// identically.
const CARD_OVERLAY_GRADIENT =
  'linear-gradient(to right, rgba(255,253,247,0.94) 0%, rgba(255,253,247,0.88) 35%, rgba(255,253,247,0.55) 55%, rgba(255,253,247,0.1) 80%, rgba(255,253,247,0) 100%)';

export default function Wizard({ archetypes, focusModes, allCollections }: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('archetype');
  const [archetype, setArchetype] = useState<OnboardingArchetype | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, setFocus] = useState<OnboardingFocus | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const collectionsByKey = useMemo(() => {
    const map = new Map<string, CollectionOption>();
    allCollections.forEach((c) => map.set(c.key, c));
    return map;
  }, [allCollections]);

  function pickArchetype(key: OnboardingArchetype) {
    const def = archetypes.find((a) => a.key === key);
    if (!def) return;
    setArchetype(key);
    const subCats = ARCHETYPE_SUBCATEGORIES[key];
    if (subCats) {
      // Pre-select the sub-categories the archetype recommends as defaults.
      setSelected(new Set(subCats.filter((s) => s.defaultSelected).map((s) => s.key)));
    } else {
      // Fallback: archetype uses the Core 12 grid, pre-select its recommended core keys.
      setSelected(new Set(def.recommendedKeys));
    }
    setStep('collections');
  }

  function toggleCollection(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function goToFocus() {
    if (selected.size === 0) {
      setError('Pick at least one collection to start with.');
      return;
    }
    setError(null);
    setStep('focus');
  }

  function pickFocus(key: OnboardingFocus) {
    setFocus(key);
    setStep('reveal');
    if (!archetype) return;
    startTransition(async () => {
      try {
        await Promise.all([
          completeOnboarding({
            archetype,
            focus: key,
            selectedCollections: Array.from(selected),
          }),
          new Promise((r) => setTimeout(r, REVEAL_DURATION_MS)),
        ]);
        router.replace('/home');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
        setStep('focus');
      }
    });
  }

  function skip() {
    startTransition(async () => {
      try {
        await skipOnboarding();
        router.replace('/home');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  return (
    <div className="space-y-8">
      <StepHeader current={step} />

      {step === 'archetype' && (
        <ArchetypeStep
          archetypes={archetypes}
          onPick={pickArchetype}
          onSkip={skip}
          skipPending={pending}
        />
      )}

      {step === 'collections' && archetype && (() => {
        const subCats = ARCHETYPE_SUBCATEGORIES[archetype];
        if (subCats) {
          return (
            <SubCategoriesStep
              archetypeKey={archetype}
              subCategories={subCats}
              selected={selected}
              onToggle={toggleCollection}
              onBack={() => setStep('archetype')}
              onNext={goToFocus}
              onSkip={skip}
              error={error}
              skipPending={pending}
            />
          );
        }
        return (
          <CollectionsStep
            archetype={archetypes.find((a) => a.key === archetype)!}
            allCollections={allCollections}
            selected={selected}
            onToggle={toggleCollection}
            onBack={() => setStep('archetype')}
            onNext={goToFocus}
            error={error}
          />
        );
      })()}

      {step === 'focus' && (
        <FocusStep
          focusModes={focusModes}
          onPick={pickFocus}
          onBack={() => setStep('collections')}
          error={error}
          pending={pending}
        />
      )}

      {step === 'reveal' && (
        <RevealStep
          selectedCount={selected.size}
          collectionsByKey={collectionsByKey}
          selectedKeys={Array.from(selected)}
        />
      )}
    </div>
  );
}

function StepHeader({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'archetype', label: 'Choose' },
    { key: 'collections', label: 'Customize' },
    { key: 'focus', label: 'Focus' },
    { key: 'reveal', label: 'Done' },
  ];
  const currentIdx = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`h-2 w-8 rounded-full transition-colors ${
              i <= currentIdx ? 'bg-forest' : 'bg-hairline'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

function ArchetypeStep({
  archetypes,
  onPick,
  onSkip,
  skipPending,
}: {
  archetypes: ArchetypeDef[];
  onPick: (key: OnboardingArchetype) => void;
  onSkip: () => void;
  skipPending: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
          What kind of collection best represents you?
        </h1>
        <p className="text-muted text-base">
          We'll set up your archive around what matters to you.
        </p>
      </div>
      <ul className="space-y-3">
        {archetypes.map((a) => (
          <li key={a.key}>
            <button
              type="button"
              onClick={() => onPick(a.key)}
              className="group relative w-full text-left overflow-hidden bg-paper border border-hairline rounded-2xl hover:border-forest hover:shadow-card transition-all"
              style={{ minHeight: 160 }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('${a.bgImage}')` }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: CARD_OVERLAY_GRADIENT }}
                aria-hidden="true"
              />
              <div className="relative z-10 p-5 sm:p-6 max-w-[60%]">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-serif text-xl sm:text-2xl text-ink">{a.title}</h3>
                </div>
                <p className="text-sm text-ink-soft mt-1">{a.tagline}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted mt-3">
                  {a.bestFor}
                </p>
                <span className="inline-block mt-3 text-xs text-forest opacity-0 group-hover:opacity-100 transition-opacity">
                  Choose →
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <div className="text-center">
        <button
          type="button"
          onClick={onSkip}
          disabled={skipPending}
          className="text-sm text-muted hover:text-ink underline disabled:opacity-50"
        >
          Skip setup for now
        </button>
      </div>
    </div>
  );
}

const SUBSTEP_COPY: Partial<Record<OnboardingArchetype, { title: string; subtitle: string }>> = {
  'family-legacy': {
    title: 'Which parts of your family story would you like to preserve?',
    subtitle:
      "Pick a few to start. You can always add more collections later.",
  },
  'collector': {
    title: 'What kinds of collections do you keep?',
    subtitle:
      "Pick a few to start. You can always add more collections later.",
  },
};

function SubCategoriesStep({
  archetypeKey,
  subCategories,
  selected,
  onToggle,
  onBack,
  onNext,
  onSkip,
  error,
  skipPending,
}: {
  archetypeKey: OnboardingArchetype;
  subCategories: SubCategory[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  error: string | null;
  skipPending: boolean;
}) {
  const copy = SUBSTEP_COPY[archetypeKey] ?? {
    title: 'Customize your collections',
    subtitle:
      "Pick a few to start. You can always add more collections later.",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start">
        <button
          type="button"
          onClick={onBack}
          className="text-ink-soft hover:text-ink p-2 -ml-2"
          aria-label="Back"
        >
          <BackArrowIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="text-center space-y-3">
        <h1 className="font-serif text-2xl sm:text-3xl text-ink leading-tight">
          {copy.title}
        </h1>
        <p className="text-muted text-sm sm:text-base max-w-xl mx-auto">
          {copy.subtitle}
        </p>
      </div>

      <ul className="space-y-3">
        {subCategories.map((s) => {
          const isSelected = selected.has(s.key);
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => onToggle(s.key)}
                className="group relative w-full text-left overflow-hidden bg-paper border border-hairline rounded-2xl hover:border-forest hover:shadow-card transition-all"
                style={{ minHeight: 124 }}
                aria-pressed={isSelected}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${s.bgImage}')` }}
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: CARD_OVERLAY_GRADIENT }}
                  aria-hidden="true"
                />
                <div className="relative z-10 flex items-start gap-3 p-4 pr-6 max-w-[48%] sm:max-w-[52%]">
                  <Checkbox checked={isSelected} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-base sm:text-lg text-ink leading-tight">
                      {s.label}
                    </h3>
                    <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-snug">
                      {s.description}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <div className="text-center text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg py-2 px-3">
          {error}
        </div>
      )}

      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={onNext}
          className="w-full inline-flex items-center justify-center gap-2 px-5 h-12 rounded-xl bg-forest text-cream text-base font-medium hover:bg-forest-deep transition-colors"
        >
          Continue
          <span aria-hidden="true">→</span>
        </button>
        <div className="text-center">
          <button
            type="button"
            onClick={onSkip}
            disabled={skipPending}
            className="text-sm text-muted hover:text-ink underline disabled:opacity-50"
          >
            I&rsquo;ll choose later
          </button>
        </div>
      </div>
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <span className="shrink-0 w-6 h-6 rounded-md bg-forest text-cream flex items-center justify-center mt-0.5">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path d="M3 8.5l3.5 3.5L13 5" />
        </svg>
      </span>
    );
  }
  return (
    <span className="shrink-0 w-6 h-6 rounded-md border-2 border-hairline bg-paper/70 mt-0.5" />
  );
}

function BackArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function CollectionsStep({
  archetype,
  allCollections,
  selected,
  onToggle,
  onBack,
  onNext,
  error,
}: {
  archetype: ArchetypeDef;
  allCollections: CollectionOption[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onBack: () => void;
  onNext: () => void;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted">
          {archetype.title}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
          Customize your collections
        </h1>
        <p className="text-muted text-base">
          Pick a few to start. You can always add more collections later.
        </p>
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {allCollections.map((c) => {
          const isSelected = selected.has(c.key);
          return (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => onToggle(c.key)}
                className={`group w-full text-center bg-paper border-2 rounded-2xl p-3 transition-all ${
                  isSelected
                    ? 'border-forest shadow-card'
                    : 'border-hairline opacity-60 hover:opacity-100 hover:border-ink-soft'
                }`}
              >
                <div className="relative w-full aspect-square">
                  {c.iconUrl ? (
                    <Image
                      src={c.iconUrl}
                      alt=""
                      width={160}
                      height={160}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      {c.glyph}
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                  )}
                </div>
                <div className="text-xs font-medium text-ink mt-1 leading-tight">
                  {c.label}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <div className="text-center text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg py-2 px-3">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted hover:text-ink underline"
        >
          ← Back
        </button>
        <div className="text-xs text-muted">
          {selected.size} selected
        </div>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center px-5 h-11 rounded-full bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function FocusStep({
  focusModes,
  onPick,
  onBack,
  error,
  pending,
}: {
  focusModes: FocusDef[];
  onPick: (key: OnboardingFocus) => void;
  onBack: () => void;
  error: string | null;
  pending: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
          What matters most to you?
        </h1>
        <p className="text-muted text-base">
          This shapes what Heirloom highlights in your daily view.
        </p>
      </div>

      <ul className="space-y-3">
        {focusModes.map((f) => (
          <li key={f.key}>
            <button
              type="button"
              onClick={() => onPick(f.key)}
              disabled={pending}
              className="group w-full text-left bg-paper border border-hairline rounded-2xl p-5 hover:border-forest hover:shadow-card transition-all disabled:opacity-50"
            >
              <h3 className="font-serif text-xl text-ink">{f.title}</h3>
              <p className="text-sm text-ink-soft mt-1">{f.tagline}</p>
              <ul className="mt-3 space-y-1">
                {f.bullets.map((b) => (
                  <li key={b} className="text-xs text-muted flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-gold" />
                    {b}
                  </li>
                ))}
              </ul>
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <div className="text-center text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg py-2 px-3">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={pending}
          className="text-sm text-muted hover:text-ink underline disabled:opacity-50"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

function RevealStep({
  selectedCount,
  collectionsByKey,
  selectedKeys,
}: {
  selectedCount: number;
  collectionsByKey: Map<string, CollectionOption>;
  selectedKeys: string[];
}) {
  return (
    <div className="text-center space-y-8 py-8 reveal-fade-in">
      <div className="space-y-3">
        <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
          Heirloom has prepared your archive.
        </h1>
        <p className="text-muted text-base">
          {selectedCount} {selectedCount === 1 ? 'collection' : 'collections'} ready for you.
        </p>
      </div>
      <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-md mx-auto">
        {selectedKeys.map((key, i) => {
          const c = collectionsByKey.get(key);
          if (!c) return null;
          return (
            <li
              key={key}
              className="reveal-card-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="bg-paper border border-hairline rounded-xl p-2">
                {c.iconUrl ? (
                  <Image
                    src={c.iconUrl}
                    alt={c.label}
                    width={140}
                    height={140}
                    className="w-full aspect-square object-contain"
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-3xl">
                    {c.glyph}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted italic">Taking you to your home view…</p>
      <style>{`
        @keyframes revealFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes revealCardFadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .reveal-fade-in {
          animation: revealFadeIn 0.6s ease-out both;
        }
        .reveal-card-fade-in {
          opacity: 0;
          animation: revealCardFadeIn 0.45s ease-out both;
        }
      `}</style>
    </div>
  );
}
