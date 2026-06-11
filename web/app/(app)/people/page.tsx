import Link from 'next/link';
import Image from 'next/image';
import { listPeople } from '@/lib/api';
import { getMyDisplayName } from '@/lib/me';
import PeopleList from './PeopleList';

export const dynamic = 'force-dynamic';

export default async function PeoplePage() {
  const [people, myName] = await Promise.all([
    listPeople(),
    getMyDisplayName(),
  ]);

  const totalItems = people.reduce((acc, p) => acc + p.itemCount, 0);
  const withPhotos = people.filter((p) => p.primaryPhotoUrl).length;
  const withDates = people.filter((p) => p.birth_date || p.death_date).length;

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
            Originators
          </h1>
          <p className="text-muted text-sm sm:text-base mt-2 max-w-xl">
            The family, friends, makers, and previous owners behind every
            heirloom.
          </p>
        </div>
        <Link
          href="/people/new"
          className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors shrink-0"
        >
          <UserPlusIcon className="w-4 h-4" />
          Add Originator
        </Link>
      </header>

      <HeroCard />

      {people.length > 0 && <PeopleList people={people} />}

      <PeopleRolesSection />

      <WorkflowAndOverviewRow
        myName={myName}
        peopleCount={people.length}
        totalItems={totalItems}
        withPhotos={withPhotos}
        withDates={withDates}
      />

      <TipBanner />
    </div>
  );
}

// ============================================================== //
//  Hero card                                                      //
// ============================================================== //

function HeroCard() {
  const bullets = [
    'Identify who owned an item',
    'Connect people to stories and photographs',
    'Preserve family history',
    'Pass names and memories to future generations',
  ];

  return (
    <section className="relative overflow-hidden bg-paper border border-hairline rounded-2xl shadow-card">
      {/* Background image — fills the whole hero block */}
      <Image
        src="/legacy-people-hero.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-right"
        priority
      />

      {/* Cream-to-transparent overlay so the text stays readable on the left */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-paper/90 via-paper/75 to-transparent lg:from-paper/90 lg:via-paper/60 lg:to-transparent"
        aria-hidden
      />

      {/* Content overlay */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2">
        {/* Left: copy */}
        <div className="p-6 sm:p-10 flex flex-col">
          <h2 className="font-serif text-2xl sm:text-3xl text-ink leading-tight">
            Plan Your Family Legacy
          </h2>
          <div className="text-ink-soft text-sm sm:text-base mt-3 max-w-md leading-relaxed space-y-3">
            <p>An heirloom without a name is just an object.</p>
            <p>
              Originators are the family members, friends, makers, and
              previous owners whose stories are inseparable from the
              items you preserve.
            </p>
          </div>

          <div className="mt-6">
            <div className="text-[11px] uppercase tracking-widest text-muted mb-3">
              With Originators you can:
            </div>
            <ul className="space-y-2.5">
              {bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 text-sm text-ink"
                >
                  <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
                    <CheckIcon className="w-3 h-3" />
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <Link
              href="/people/new"
              className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
            >
              <UserPlusIcon className="w-4 h-4" />
              Add Originator
            </Link>
          </div>
        </div>

        {/* Right: spacer so the image shows through */}
        <div className="hidden lg:block min-h-[420px]" aria-hidden />
      </div>
    </section>
  );
}

// ============================================================== //
//  People roles                                                   //
// ============================================================== //

function PeopleRolesSection() {
  const roles = [
    {
      key: 'owner',
      title: 'Original Owner',
      icon: <CrownIcon />,
      body: 'The person who first owned, commissioned, or acquired the item.',
      examples: [
        'Grandparent who bought a watch new',
        'Ancestor who commissioned a portrait',
        'First owner of a family bible',
      ],
    },
    {
      key: 'inherited',
      title: 'Inherited From',
      icon: <ScrollIcon />,
      body: 'The person you (or a previous custodian) received the item from.',
      examples: [
        'Parent who passed down a ring',
        'Aunt who bequeathed a quilt',
        'Estate of a great-uncle',
      ],
    },
    {
      key: 'maker',
      title: 'Maker or Creator',
      icon: <HammerIcon />,
      body: 'The person who made, painted, photographed, or crafted the item.',
      examples: [
        'Artist who painted a portrait',
        'Photographer behind a family print',
        'Grandparent who built the cradle',
      ],
    },
    {
      key: 'connected',
      title: 'Family & Friends',
      icon: <PeopleIcon />,
      body: 'People photographed in, mentioned by, or otherwise connected to the item.',
      examples: [
        'Children in a holiday photograph',
        'Friend named in a letter',
        'Sibling who appears in a journal entry',
      ],
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl text-ink">
          How People Connect to Items
        </h2>
        <p className="text-muted text-sm max-w-2xl mt-1">
          A single heirloom can carry the fingerprints of many people. We
          group their roles into four common categories so you can capture
          the full story without losing the details.
        </p>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {roles.map((r) => (
          <li
            key={r.key}
            className="bg-paper border border-hairline rounded-2xl p-5 space-y-3 shadow-card"
          >
            <div className="flex items-center gap-2">
              <span className="shrink-0 w-10 h-10 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
                {r.icon}
              </span>
              <h3 className="font-serif text-xl text-ink leading-tight">
                {r.title}
              </h3>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">{r.body}</p>
            <div className="space-y-1 pt-1">
              <div className="text-[11px] uppercase tracking-wider text-muted">
                Examples
              </div>
              <ul className="space-y-1">
                {r.examples.map((ex) => (
                  <li
                    key={ex}
                    className="flex items-center gap-2 text-sm text-ink-soft"
                  >
                    <CheckIcon className="w-3 h-3 text-forest shrink-0" />
                    <span>{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ============================================================== //
//  Workflow + overview row                                        //
// ============================================================== //

function WorkflowAndOverviewRow({
  myName,
  peopleCount,
  totalItems,
  withPhotos,
  withDates,
}: {
  myName: string;
  peopleCount: number;
  totalItems: number;
  withPhotos: number;
  withDates: number;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <HowProvenanceWorksCard myName={myName} />
      <ProvenanceOverviewCard
        peopleCount={peopleCount}
        totalItems={totalItems}
        withPhotos={withPhotos}
        withDates={withDates}
      />
    </div>
  );
}

function HowProvenanceWorksCard({ myName }: { myName: string }) {
  const steps = [
    {
      kicker: 'Original Owner',
      name: 'Great-Grandpa Henry',
      body: 'The first person to own the item — where the story begins.',
      tone: 'muted' as const,
    },
    {
      kicker: 'Inherited From',
      name: 'Grandpa Joe',
      body: 'The person who passed the item to its next custodian.',
      tone: 'forest' as const,
    },
    {
      kicker: 'Current Custodian',
      name: myName,
      body: 'The person responsible for the item today.',
      tone: 'soft' as const,
    },
  ];

  return (
    <section className="bg-paper border border-hairline rounded-2xl p-6 sm:p-8 shadow-card">
      <h3 className="font-serif text-xl text-ink">How Provenance Works</h3>
      <p className="text-sm text-muted mt-1 leading-relaxed">
        Provenance is the chain of custody an item travels through —
        each person on the chain adds a chapter.
      </p>

      <ol className="mt-6 space-y-5 relative">
        {steps.map((s, idx) => (
          <WorkflowStep
            key={s.kicker}
            kicker={s.kicker}
            name={s.name}
            body={s.body}
            tone={s.tone}
            isLast={idx === steps.length - 1}
          />
        ))}
      </ol>
    </section>
  );
}

function ProvenanceOverviewCard({
  peopleCount,
  totalItems,
  withPhotos,
  withDates,
}: {
  peopleCount: number;
  totalItems: number;
  withPhotos: number;
  withDates: number;
}) {
  const stats = [
    { value: peopleCount, label: 'People', icon: <PeopleIcon /> },
    { value: totalItems, label: 'Linked Items', icon: <ArchiveIcon /> },
    { value: withPhotos, label: 'With Photos', icon: <PortraitIcon /> },
    { value: withDates, label: 'With Life Dates', icon: <CalendarIcon /> },
  ];

  return (
    <section className="bg-paper border border-hairline rounded-2xl p-6 sm:p-8 shadow-card flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-xl text-ink">Provenance Overview</h3>
        <Link
          href="#your-people"
          className="text-xs font-medium text-forest hover:text-forest-deep inline-flex items-center gap-1"
        >
          View Full Summary
          <ChevronRightIcon />
        </Link>
      </div>

      <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
        {stats.map((s) => (
          <li
            key={s.label}
            className="bg-cream-soft/60 border border-hairline rounded-xl p-3 text-center"
          >
            <div className="mx-auto w-9 h-9 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
              {s.icon}
            </div>
            <div className="font-serif text-lg text-ink leading-none mt-2 truncate">
              {s.value}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted mt-1.5 leading-tight">
              {s.label}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-sm text-ink-soft mt-6 leading-relaxed">
        {peopleCount > 0
          ? 'These people anchor the stories behind every item in your archive.'
          : 'Start by adding an Originator — the first link in your archive’s human chain.'}
      </p>

      <div className="mt-auto pt-6 flex justify-center text-gold-soft">
        <FamilyDecorIcon />
      </div>
    </section>
  );
}

function WorkflowStep({
  kicker,
  name,
  body,
  tone,
  isLast,
}: {
  kicker: string;
  name: string;
  body: string;
  tone: 'muted' | 'forest' | 'soft';
  isLast: boolean;
}) {
  const avatarClass =
    tone === 'forest'
      ? 'bg-forest text-cream border-forest'
      : tone === 'soft'
        ? 'bg-gold-soft text-gold-deep border-gold-soft'
        : 'bg-cream-soft text-ink-soft border-hairline';
  return (
    <li className="grid grid-cols-[44px_minmax(0,1fr)] gap-4">
      <div className="relative flex flex-col items-center">
        <span
          className={`w-10 h-10 rounded-full flex items-center justify-center border ${avatarClass}`}
        >
          <UserIconSmall />
        </span>
        {!isLast && (
          <span
            className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-full border-l border-dashed border-hairline"
            aria-hidden
          />
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] gap-1 sm:gap-3 pb-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-gold-deep">
            {kicker}
          </div>
          <div className="font-serif text-base text-ink leading-tight mt-0.5 truncate">
            {name}
          </div>
        </div>
        <p className="text-xs text-ink-soft leading-relaxed sm:mt-0.5">
          {body}
        </p>
      </div>
    </li>
  );
}

// ============================================================== //
//  Tip banner                                                     //
// ============================================================== //

function TipBanner() {
  return (
    <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-cream-soft/70 border border-hairline rounded-2xl px-5 py-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
          <LightbulbIcon />
        </span>
        <p className="text-sm text-ink-soft leading-relaxed">
          <span className="font-medium text-ink">Tip:</span> You can
          connect an Originator to an item directly from the
          item&rsquo;s detail page.
        </p>
      </div>
      <Link
        href="/people/new"
        className="shrink-0 text-sm font-medium text-forest hover:text-forest-deep inline-flex items-center gap-1"
      >
        Learn How
        <ChevronRightIcon />
      </Link>
    </section>
  );
}

// ============================================================== //
//  Icons                                                          //
// ============================================================== //

function svg(d: string, size = 18): React.ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
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
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3 21c0-3.5 3.5-6 7-6s7 2.5 7 6" />
      <path d="M18 9v6M15 12h6" />
    </svg>
  );
}

function PeopleIcon() {
  return svg(
    'M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM15 14h2c2.2 0 4 1.8 4 4',
  );
}

function CrownIcon() {
  return svg('M3 18h18M5 18l-1-9 5 4 3-6 3 6 5-4-1 9');
}

function ScrollIcon() {
  return svg(
    'M7 2h11a3 3 0 0 1 3 3v3h-3M7 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-3H7M7 2v18M10 7h6M10 11h6',
  );
}

function HammerIcon() {
  return svg(
    'M14 4l6 6-3 3-6-6zM11 9l-7 7v4h4l7-7M5 19l-1 1',
  );
}

function ArchiveIcon() {
  return svg('M4 7h16v12H4zM3 4h18v4H3zM10 12h4', 16);
}

function PortraitIcon() {
  return svg(
    'M4 4h16v16H4zM12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM7 17c1-2.5 3-3.5 5-3.5s4 1 5 3.5',
    16,
  );
}

function CalendarIcon() {
  return svg('M4 6h16v14H4zM4 10h16M8 3v4M16 3v4', 16);
}

function UserIconSmall() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={16}
      height={16}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

function FamilyDecorIcon() {
  return (
    <svg
      viewBox="0 0 120 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={120}
      height={24}
      aria-hidden="true"
    >
      <path d="M0 12h45M75 12h45" />
      <circle cx="56" cy="12" r="4" />
      <circle cx="64" cy="12" r="4" />
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

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={14}
      height={14}
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={14}
      height={14}
      aria-hidden="true"
    >
      <path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c1 1 1.5 2 1.5 3.5h5c0-1.5.5-2.5 1.5-3.5A6 6 0 0 0 12 2z" />
    </svg>
  );
}
