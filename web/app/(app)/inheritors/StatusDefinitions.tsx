// Reusable status-definitions panel — mirrors the Permission Levels
// section on the Conservators page, so users see what each status
// actually means right next to the dropdown that picks it.

import { STATUS_LABEL } from '@/lib/inheritors';
import type { InheritorStatus } from '@/lib/types';

interface Def {
  status: InheritorStatus;
  icon: React.ReactNode;
  description: string;
  best: string[];
  notes: string[];
}

const DEFS: Def[] = [
  {
    status: 'designated_heir',
    icon: <CrownIcon />,
    description:
      'Your primary recipient. The person you most want to receive each piece.',
    best: ['Pass items down a family line', 'Default for most assignments'],
    notes: [],
  },
  {
    status: 'beneficiary',
    icon: <DocIcon />,
    description:
      'Named in your will or trust. May receive value, proceeds, or specific bequests.',
    best: ['Anyone formally listed in legal documents'],
    notes: [],
  },
  {
    status: 'alternate',
    icon: <ShuffleIcon />,
    description:
      'Backup recipient. Receives the item only if the Designated Heir cannot or will not.',
    best: ['Contingency for primary inheritors', 'Second-in-line within a family branch'],
    notes: [],
  },
  {
    status: 'charity',
    icon: <HeartIcon />,
    description:
      'A non-profit organization you want to support with specific items or their proceeds.',
    best: ['Items to be donated', 'Estate sale proceeds directed to a cause'],
    notes: [],
  },
  {
    status: 'museum',
    icon: <ColumnsIcon />,
    description:
      'An institution that will preserve items for public archival or display.',
    best: ['Historically significant pieces', 'Items with provenance worth public access'],
    notes: [],
  },
  {
    status: 'undecided',
    icon: <QuestionIcon />,
    description:
      'A placeholder while you make up your mind. Acts as a holding bucket.',
    best: ['Items you want to assign later', 'Recipients still being chosen'],
    notes: [],
  },
];

export default function StatusDefinitions({
  collapsedByDefault = false,
}: {
  collapsedByDefault?: boolean;
}) {
  const content = (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {DEFS.map((d) => (
        <li
          key={d.status}
          className="bg-paper border border-hairline rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="shrink-0 w-9 h-9 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
              {d.icon}
            </span>
            <h3 className="font-serif text-lg text-ink">
              {STATUS_LABEL[d.status]}
            </h3>
          </div>
          <p className="text-sm text-ink-soft leading-snug">{d.description}</p>
          {d.best.length > 0 && (
            <ul className="space-y-1">
              {d.best.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-xs text-ink-soft"
                >
                  <CheckIcon className="w-3.5 h-3.5 text-forest mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );

  if (collapsedByDefault) {
    return (
      <details className="bg-paper border border-hairline rounded-2xl p-4">
        <summary className="cursor-pointer text-sm font-medium text-ink-soft hover:text-ink list-none flex items-center justify-between">
          <span>What do the statuses mean?</span>
          <span className="text-xs text-muted">Show</span>
        </summary>
        <div className="pt-4">{content}</div>
      </details>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl text-ink">Status definitions</h2>
      <p className="text-muted text-sm">
        Pick the status that best reflects how you want this person or
        institution to receive their portion of the archive.
      </p>
      {content}
    </section>
  );
}

// ============================================================== //
//  Icons                                                          //
// ============================================================== //

function svg(d: string): React.ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={18}
      height={18}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

function CrownIcon() {
  return svg('M3 18h18M5 18l-1-9 5 4 3-6 3 6 5-4-1 9');
}

function DocIcon() {
  return svg('M6 3h9l3 3v15H6zM15 3v3h3M9 10h6M9 13h6M9 16h4');
}

function ShuffleIcon() {
  return svg(
    'M16 3l5 5-5 5M3 18l5-5M16 21l5-5M3 6l5 5M16 8h5M16 16h5',
  );
}

function HeartIcon() {
  return svg(
    'M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10z',
  );
}

function ColumnsIcon() {
  return svg(
    'M3 21h18M5 21V8m6 13V8m4 13V8m4 13V8M3 8h18l-9-5z',
  );
}

function QuestionIcon() {
  return svg(
    'M12 16h.01M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4',
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={14}
      height={14}
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-12" />
    </svg>
  );
}
