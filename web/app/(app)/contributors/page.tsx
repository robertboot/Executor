import Link from 'next/link';
import { listPeople, listInheritors, listConservators } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function ContributorsPage() {
  const [people, inheritors, conservators] = await Promise.all([
    listPeople(),
    listInheritors(),
    listConservators(),
  ]);

  return (
    <div className="space-y-8 pb-24">
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

      <ul className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <li>
          <ContributorCard
            href="/people"
            kicker="Provenance · Stories · Memory"
            title="Legacy People"
            description="Track the family, friends, and previous owners behind every heirloom. Answer: who is part of this item's story?"
            count={people.length}
            countLabel={people.length === 1 ? 'person' : 'people'}
            cta="Manage Legacy People"
            icon={<PeopleIcon />}
          />
        </li>
        <li>
          <ContributorCard
            href="/inheritors"
            kicker="Succession · Bequests · Future"
            title="Inheritors"
            description="Designate who should receive items, collections, and heirlooms in the future. Answer: who receives this item next?"
            count={inheritors.length}
            countLabel={inheritors.length === 1 ? 'inheritor' : 'inheritors'}
            cta="Manage Inheritors"
            icon={<ScrollIcon />}
          />
        </li>
        <li>
          <ContributorCard
            href="/conservators"
            kicker="Access · Trust · Audit"
            title="Conservators"
            description="Invite trusted people to view, edit, and preserve the archive. Every change is permanently logged."
            count={conservators.length}
            countLabel={
              conservators.length === 1 ? 'conservator' : 'conservators'
            }
            cta="Manage Conservators"
            icon={<ShieldIcon />}
          />
        </li>
      </ul>

      <section className="bg-paper border border-hairline rounded-2xl p-5 sm:p-6 space-y-3">
        <h2 className="font-serif text-xl text-ink">
          One person, three possible roles
        </h2>
        <p className="text-ink-soft text-sm leading-relaxed max-w-3xl">
          A single heirloom can connect to three distinct people-related
          relationships, and a single human can hold more than one of
          those roles. Grandpa Joe&rsquo;s pocket watch{' '}
          <em>belonged to</em> Joe (Legacy Person), is{' '}
          <em>designated for</em> Sarah (Inheritor), and Emily can{' '}
          <em>edit</em> the record (Conservator). Each section above
          tracks one of those questions; together they form your archive.
        </p>
      </section>
    </div>
  );
}

function ContributorCard({
  href,
  kicker,
  title,
  description,
  count,
  countLabel,
  cta,
  icon,
}: {
  href: string;
  kicker: string;
  title: string;
  description: string;
  count: number;
  countLabel: string;
  cta: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block h-full bg-paper border border-hairline rounded-2xl p-5 sm:p-6 shadow-card hover:shadow-raised hover:border-forest/30 transition-all"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="shrink-0 w-12 h-12 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
          {icon}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted">
          {kicker}
        </div>
      </div>
      <h2 className="font-serif text-2xl text-ink leading-tight">
        {title}
      </h2>
      <p className="text-sm text-ink-soft mt-2 leading-relaxed">
        {description}
      </p>
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
    </Link>
  );
}

// ============================================================== //
//  Icons                                                          //
// ============================================================== //

function PeopleIcon() {
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
      <path d="M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM15 14h2c2.2 0 4 1.8 4 4" />
    </svg>
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

function ShieldIcon() {
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
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
