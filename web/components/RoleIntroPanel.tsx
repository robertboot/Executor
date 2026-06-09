// Definition card shown above the form on /people/new, /inheritors/new,
// and /conservators/new. Mirrors the "Meet Your Contributors" framing
// on the welcome screen so users see what each role actually means
// right before they fill in the details.

type RoleKey = 'legacy' | 'inheritor' | 'conservator';

interface RoleDef {
  kicker: string;
  title: string;
  description: string;
  examples: string[];
  icon: React.ReactNode;
}

const ROLES: Record<RoleKey, RoleDef> = {
  legacy: {
    kicker: 'The Past',
    title: 'Legacy Person',
    description:
      "People who owned, made, or appear in your item's story. Capturing them keeps the provenance and context alive across generations.",
    examples: [
      'Grandfather who carried the pocket watch',
      'Mother who quilted the blanket',
      'Original owner of the painting',
      'Person photographed in a family portrait',
    ],
    icon: <PeopleIcon />,
  },
  inheritor: {
    kicker: 'The Future',
    title: 'Inheritor',
    description:
      "People (or institutions) you want each item to reach next. Designate who should receive what so your wishes stay documented in one place.",
    examples: [
      'Daughter Sarah — primary heir to family jewelry',
      'Alternate recipient if the primary cannot inherit',
      'Museum or charity for historically significant pieces',
      'Beneficiary listed in a will or trust',
    ],
    icon: <ScrollIcon />,
  },
  conservator: {
    kicker: 'The Present',
    title: 'Conservator',
    description:
      'Trusted family members or experts who help you keep the archive accurate today. They can view, edit, and preserve the record alongside you.',
    examples: [
      'Spouse helping catalog inherited items',
      'Family historian researching provenance',
      'Trusted relative auditing valuations',
      'Professional archivist or estate planner',
    ],
    icon: <ShieldIcon />,
  },
};

export default function RoleIntroPanel({ role }: { role: RoleKey }) {
  const r = ROLES[role];
  return (
    <section className="bg-paper border border-hairline rounded-2xl p-5 sm:p-6 shadow-card">
      <div className="flex items-center gap-3 mb-3">
        <span
          className="shrink-0 w-12 h-12 rounded-full text-gold-deep flex items-center justify-center border border-gold-deep/25"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, #F8EBCC 0%, #EDD9A6 55%, #D9B97A 100%)',
            boxShadow:
              'inset 0 1px 2px rgba(255,255,255,0.7), 0 2px 5px rgba(180,140,55,0.15)',
          }}
        >
          {r.icon}
        </span>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted">
            {r.kicker}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-ink leading-tight">
            {r.title}
          </h2>
        </div>
      </div>
      <p className="text-sm text-ink-soft leading-relaxed">{r.description}</p>
      <div className="mt-4 pt-4 border-t border-hairline">
        <div className="text-[11px] uppercase tracking-wider text-muted mb-2">
          Examples
        </div>
        <ul className="space-y-1.5">
          {r.examples.map((ex) => (
            <li
              key={ex}
              className="flex items-start gap-2 text-sm text-ink-soft leading-snug"
            >
              <CheckIcon className="w-3.5 h-3.5 text-forest mt-1 shrink-0" />
              <span>{ex}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// --- Icons ------------------------------------------------------ //

function PeopleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M15 14h2c2.2 0 4 1.8 4 4" />
    </svg>
  );
}

function ScrollIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 2h11a3 3 0 0 1 3 3v3h-3M7 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-3H7M7 2v18" />
      <path d="M10 7h6M10 11h6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
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
