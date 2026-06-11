import Link from 'next/link';
import Image from 'next/image';
import { listPeople, listInheritors, listConservators } from '@/lib/api';
import DemoRoleCard from './DemoRoleCard';

export const dynamic = 'force-dynamic';

export default async function ContributorsPage() {
  const [people, inheritors, conservators] = await Promise.all([
    listPeople(),
    listInheritors(),
    listConservators(),
  ]);

  const totalContributors =
    people.length + inheritors.length + conservators.length;

  return (
    <div className="space-y-6 pb-24">
      {/* Hero */}
      <HeroCard totalContributors={totalContributors} />

      {/* Contributors header */}
      <header>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
          Contributors
        </h1>
        <p className="text-muted text-sm sm:text-base mt-2 max-w-2xl">
          Everyone who shapes your archive — the people in your items&rsquo;
          stories, the people who will receive them, and the people
          helping you preserve the record.
        </p>
      </header>

      {/* Three role cards */}
      <ul className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <li>
          <ContributorCard
            href="/people"
            image="/contributors/legacy-people.png"
            kicker="Past · Provenance · Stories"
            title="Originators"
            description="Track the family, friends, and previous owners behind every heirloom."
            question="Who is part of this item's story?"
            count={people.length}
            countLabel={people.length === 1 ? 'person' : 'people'}
            cta="Manage Originators"
            icon={<PeopleIcon />}
          />
        </li>
        <li>
          <ContributorCard
            href="/inheritors"
            image="/contributors/inheritors.png"
            kicker="Future · Succession · Bequests"
            title="Inheritors"
            description="Designate who should receive items, collections, and heirlooms in the future."
            question="Who receives this item next?"
            count={inheritors.length}
            countLabel={inheritors.length === 1 ? 'inheritor' : 'inheritors'}
            cta="Manage Inheritors"
            icon={<ScrollIcon />}
          />
        </li>
        <li>
          <ContributorCard
            href="/conservators"
            image="/contributors/conservators.png"
            kicker="Present · Access · Audit"
            title="Conservators"
            description="Invite trusted people to view, edit, and preserve the archive together."
            question="Who helps you keep the record?"
            count={conservators.length}
            countLabel={
              conservators.length === 1 ? 'conservator' : 'conservators'
            }
            cta="Manage Conservators"
            icon={<ShieldIcon />}
          />
        </li>
      </ul>

      {/* One person, three roles — visualized */}
      <ThreeRolesExample />

      {/* Where to start */}
      <WhereToStart
        peopleCount={people.length}
        inheritorCount={inheritors.length}
        conservatorCount={conservators.length}
      />
    </div>
  );
}

// ============================================================== //
//  Hero                                                           //
// ============================================================== //

function HeroCard({ totalContributors }: { totalContributors: number }) {
  return (
    <section className="relative overflow-hidden bg-paper border border-hairline rounded-2xl shadow-card">
      <Image
        src="/contributors/hero-bg.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-bottom pointer-events-none"
        priority
      />
      <div className="absolute inset-0 bg-white/70 pointer-events-none" aria-hidden />
      <div className="relative grid grid-cols-1 lg:grid-cols-2">
        {/* Copy */}
        <div className="order-2 lg:order-1 p-6 sm:p-8 flex flex-col justify-start">
          <h2 className="font-serif text-4xl sm:text-5xl text-ink leading-tight">
            Every heirloom has a human chain
          </h2>
          <p className="text-muted text-sm sm:text-base mt-3 max-w-xl">
            An item is more than an object — it is the people who owned it,
            the people who will inherit it, and the people who help you
            remember it. Contributors gives each of those relationships its
            own place in your archive.
          </p>
          {totalContributors > 0 && (
            <p className="text-xs text-muted mt-3">
              You&rsquo;ve added{' '}
              <span className="text-ink font-medium">{totalContributors}</span>{' '}
              {totalContributors === 1 ? 'contributor' : 'contributors'} so
              far.
            </p>
          )}
        </div>

        {/* Heirloom photo */}
        <div className="order-1 lg:order-2 relative min-h-[200px] sm:min-h-[260px] lg:min-h-[360px]">
          <Image
            src="/contributors/hero.png"
            alt="An antique pocket watch, a framed family portrait, old books, and handwritten letters on a writing desk"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}

// ============================================================== //
//  Three-roles example                                            //
// ============================================================== //

function ThreeRolesExample() {
  const roles = [
    {
      kicker: 'Originator',
      name: 'Grandpa Joe',
      relationship: 'Grandpa, maternal side',
      body: "Joe carried this pocket watch every day for fifty years. He belongs to the watch's story.",
      blurb:
        'In your archive, opening an Originator shows their bio, the items and stories they appear in, and how they connect to the people who came after them.',
      tag: 'Past',
      ctaHref: '/people',
      ctaLabel: 'Add Originators',
      icon: <PeopleIcon />,
    },
    {
      kicker: 'Inheritor',
      name: 'Sarah',
      relationship: 'Granddaughter',
      body: "Sarah is designated to receive the watch one day. She belongs to the watch's future.",
      blurb:
        'In your archive, opening an Inheritor shows their bio and exactly which items, collections, and heirlooms are set to pass to them.',
      tag: 'Future',
      ctaHref: '/inheritors',
      ctaLabel: 'Add Inheritors',
      icon: <ScrollIcon />,
    },
    {
      kicker: 'Conservator',
      name: 'Emily',
      relationship: 'Sister',
      body: 'Emily helps keep the archive accurate. She can edit the record today.',
      blurb:
        "In your archive, opening a Conservator shows their bio, their access level, and a record of what they've helped maintain.",
      tag: 'Present',
      ctaHref: '/conservators',
      ctaLabel: 'Add Conservators',
      icon: <ShieldIcon />,
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl text-ink">
          One heirloom, three relationships
        </h2>
        <p className="text-muted text-sm max-w-2xl mt-1">
          A single item can connect to all three contributor types — and
          a single human can hold more than one of those roles. Here is
          what that looks like for Grandpa Joe&rsquo;s pocket watch.
        </p>
      </div>

      <div className="bg-paper border border-hairline rounded-2xl p-6 sm:p-8 shadow-card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-hairline">
          <span className="shrink-0 w-10 h-10 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
            <WatchIcon />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#C29A4E]">
              Example heirloom
            </div>
            <div className="font-serif text-lg text-ink leading-tight">
              Grandpa Joe&rsquo;s Pocket Watch
            </div>
          </div>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <li>
            <div className="relative h-full min-h-[180px] overflow-hidden rounded-xl border border-hairline bg-cream-soft">
              <Image
                src="/contributors/pocket-watch.png"
                alt="Grandpa Joe's antique gold pocket watch"
                fill
                sizes="(max-width: 1024px) 100vw, 25vw"
                className="object-cover"
              />
            </div>
          </li>
          {roles.map((r) => (
            <li key={r.kicker}>
              <DemoRoleCard
                icon={r.icon}
                kicker={r.kicker}
                name={r.name}
                relationship={r.relationship}
                tag={r.tag}
                body={r.body}
                blurb={r.blurb}
                ctaHref={r.ctaHref}
                ctaLabel={r.ctaLabel}
              />
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted mt-6 pt-4 border-t border-hairline leading-relaxed">
          The same person can appear in more than one section — the
          grandparent an heirloom first came from might also be set to
          inherit another, making them both an Originator and an Inheritor.
        </p>
      </div>
    </section>
  );
}

// ============================================================== //
//  Where to start                                                 //
// ============================================================== //

function WhereToStart({
  peopleCount,
  inheritorCount,
  conservatorCount,
}: {
  peopleCount: number;
  inheritorCount: number;
  conservatorCount: number;
}) {
  const suggestions: { href: string; title: string; body: string }[] = [];
  if (peopleCount === 0) {
    suggestions.push({
      href: '/people/new',
      title: 'Add your first Originator',
      body: 'A parent, grandparent, or original owner is usually the easiest place to start.',
    });
  }
  if (inheritorCount === 0) {
    suggestions.push({
      href: '/inheritors/new',
      title: 'Designate your first Inheritor',
      body: 'Record who should receive a single meaningful item — you can always add more later.',
    });
  }
  if (conservatorCount === 0) {
    suggestions.push({
      href: '/conservators/new',
      title: 'Invite your first Conservator',
      body: 'A spouse, sibling, or trusted historian can help you keep the archive accurate.',
    });
  }

  if (suggestions.length === 0) {
    return (
      <section className="relative overflow-hidden bg-paper border border-hairline rounded-2xl p-5 sm:p-6 shadow-card">
        <div className="relative z-10 flex items-start gap-4">
          <span className="shrink-0 w-12 h-12 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
            <LeafIcon />
          </span>
          <div>
            <h2 className="font-serif text-xl text-ink">
              All three roles in play
            </h2>
            <p className="text-ink-soft text-sm leading-relaxed mt-2 max-w-3xl">
              You&rsquo;ve added contributors to all three sections — your
              archive captures the past, future, and present of every item.
              Keep refining each profile as new stories surface.
            </p>
          </div>
        </div>
        <TreeWatermark className="pointer-events-none absolute -right-5 -bottom-7 w-40 h-40 text-forest/10" />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl text-ink">Where to start</h2>
        <p className="text-muted text-sm max-w-2xl mt-1">
          A few suggestions to round out your contributor list.
        </p>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="group block h-full bg-paper border border-hairline rounded-2xl p-5 shadow-card hover:shadow-raised hover:border-forest/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="shrink-0 w-8 h-8 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
                  <PlusIcon className="w-4 h-4" />
                </span>
                <h3 className="font-serif text-lg text-ink leading-tight">
                  {s.title}
                </h3>
              </div>
              <p className="text-sm text-ink-soft leading-relaxed">{s.body}</p>
              <span className="inline-flex items-center gap-1 text-sm text-forest font-medium mt-4 group-hover:gap-2 transition-all">
                Get started →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ============================================================== //
//  Contributor card                                               //
// ============================================================== //

function ContributorCard({
  href,
  image,
  kicker,
  title,
  description,
  question,
  count,
  countLabel,
  cta,
  icon,
}: {
  href: string;
  image: string;
  kicker: string;
  title: string;
  description: string;
  question: string;
  count: number;
  countLabel: string;
  cta: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden bg-paper border border-hairline rounded-2xl shadow-card hover:shadow-raised hover:border-forest/30 transition-all"
    >
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
            {icon}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#C29A4E]">
            {kicker}
          </div>
        </div>
        <h2 className="font-serif text-2xl text-ink leading-tight">{title}</h2>
        <p className="text-sm text-ink-soft mt-2 leading-relaxed">
          {description}
        </p>
        <p className="text-xs italic text-muted mt-3 leading-relaxed">
          &ldquo;{question}&rdquo;
        </p>
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mt-5">
            <span className="font-serif text-3xl text-ink leading-none">
              {count}
            </span>
            <span className="text-xs text-muted uppercase tracking-wider">
              {countLabel}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 mt-5 px-4 h-10 rounded-lg bg-forest text-cream text-sm font-medium group-hover:bg-forest-deep transition-colors">
            {cta} →
          </span>
        </div>
      </div>
      <div className="relative h-24 w-full">
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
    </Link>
  );
}

// ============================================================== //
//  Icons                                                          //
// ============================================================== //

function svg(d: string, size = 20): React.ReactNode {
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

function PeopleIcon() {
  return svg(
    'M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM15 14h2c2.2 0 4 1.8 4 4',
  );
}

function ScrollIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={20}
      height={20}
      aria-hidden="true"
    >
      <path d="M7 2h11a3 3 0 0 1 3 3v3h-3M7 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-3H7M7 2v18" />
      <path d="M10 7h6M10 11h6" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={20}
      height={20}
      aria-hidden="true"
    >
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function WatchIcon() {
  return svg(
    'M12 7v5l3 2M8 3l1 3M16 3l-1 3M8 21l1-3M16 21l-1-3M5 12a7 7 0 1 0 14 0 7 7 0 0 0-14 0z',
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

function LeafIcon() {
  return svg('M5 18C5 10 10 6 18 6C18 14 13 18 5 18ZM8.5 15.5L16 8', 22);
}

function TreeWatermark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M50 96V52" />
      <path d="M50 70 34 54M50 62 66 46M50 56 40 40M50 50 62 36M50 46V30" />
      <circle cx="50" cy="26" r="16" />
      <circle cx="34" cy="38" r="9" />
      <circle cx="66" cy="40" r="10" />
      <circle cx="40" cy="22" r="8" />
      <circle cx="62" cy="22" r="8" />
    </svg>
  );
}
