'use client';

import { useState } from 'react';
import { STATUS_LABEL, STATUS_OPTIONS } from '@/lib/inheritors';
import { LEVEL_LABEL, LEVEL_OPTIONS } from '@/lib/conservators';

// Shared cross-role toggles for the Inheritor and Conservator forms.
// `current` is the role this form is FOR (omit it from the toggle list).
// When one of the toggles is checked but the form isn't linked to a
// Legacy Person yet, the action will auto-create one so all the role
// rows can share the same identity.
export default function CrossRoleToggles({
  current,
  legacyPerson,
  inheritor,
  conservator,
  defaultStatus,
  defaultLevel,
}: {
  current: 'inheritor' | 'conservator';
  legacyPerson: { id: string } | null;
  inheritor: { status: (typeof STATUS_OPTIONS)[number] } | null;
  conservator: { permission_level: (typeof LEVEL_OPTIONS)[number] } | null;
  defaultStatus?: (typeof STATUS_OPTIONS)[number];
  defaultLevel?: (typeof LEVEL_OPTIONS)[number];
}) {
  const [alsoPerson, setAlsoPerson] = useState(!!legacyPerson);
  const [alsoInheritor, setAlsoInheritor] = useState(!!inheritor);
  const [inheritorStatus, setInheritorStatus] = useState<
    (typeof STATUS_OPTIONS)[number]
  >(inheritor?.status ?? defaultStatus ?? 'designated_heir');
  const [alsoConservator, setAlsoConservator] = useState(!!conservator);
  const [conservatorLevel, setConservatorLevel] = useState<
    (typeof LEVEL_OPTIONS)[number]
  >(conservator?.permission_level ?? defaultLevel ?? 'viewer');

  const showInheritor = current !== 'inheritor';
  const showConservator = current !== 'conservator';

  return (
    <fieldset className="space-y-3 border-t border-hairline pt-6">
      <legend className="font-serif text-lg text-ink">Also designate as</legend>
      <p className="text-xs text-muted leading-relaxed -mt-1">
        Designate this person as additional roles. They&rsquo;ll appear in
        each section they hold. Linking everything to a single Legacy
        Person record keeps name and photo updates in sync across the
        archive — if you haven&rsquo;t linked one, we&rsquo;ll create one
        from this form&rsquo;s name on save.
      </p>

      {/* Always-on: ensure a Legacy Person backs this row */}
      <div className="bg-paper border border-hairline rounded-xl p-4 space-y-2">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="also_person"
            value="1"
            checked={alsoPerson}
            disabled={!!legacyPerson}
            onChange={(e) => setAlsoPerson(e.target.checked)}
            className="h-4 w-4 accent-forest"
          />
          <span className="font-medium text-ink">Legacy Person</span>
          <span className="text-xs text-muted">
            {legacyPerson
              ? '— already linked'
              : '— save as a Legacy Person too (auto-created from the name on this form)'}
          </span>
        </label>
      </div>

      {showInheritor && (
        <div className="bg-paper border border-hairline rounded-xl p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="also_inheritor"
              value="1"
              checked={alsoInheritor}
              onChange={(e) => setAlsoInheritor(e.target.checked)}
              className="h-4 w-4 accent-forest"
            />
            <span className="font-medium text-ink">Inheritor</span>
            <span className="text-xs text-muted">
              — designated to receive items in the future
            </span>
          </label>
          {alsoInheritor && (
            <div className="pl-7">
              <label className="text-[11px] uppercase tracking-wider text-muted block mb-1">
                Status
              </label>
              <select
                name="inheritor_status"
                value={inheritorStatus}
                onChange={(e) =>
                  setInheritorStatus(
                    e.target.value as (typeof STATUS_OPTIONS)[number],
                  )
                }
                className="w-full sm:w-72 bg-paper border border-hairline rounded-lg px-3 h-10 text-sm text-ink focus:outline-none focus:border-forest"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {STATUS_LABEL[opt]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {showConservator && (
        <div className="bg-paper border border-hairline rounded-xl p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="also_conservator"
              value="1"
              checked={alsoConservator}
              onChange={(e) => setAlsoConservator(e.target.checked)}
              className="h-4 w-4 accent-forest"
            />
            <span className="font-medium text-ink">Conservator</span>
            <span className="text-xs text-muted">
              — trusted helper with view or edit access
            </span>
          </label>
          {alsoConservator && (
            <div className="pl-7">
              <label className="text-[11px] uppercase tracking-wider text-muted block mb-1">
                Permission level
              </label>
              <select
                name="conservator_level"
                value={conservatorLevel}
                onChange={(e) =>
                  setConservatorLevel(
                    e.target.value as (typeof LEVEL_OPTIONS)[number],
                  )
                }
                className="w-full sm:w-72 bg-paper border border-hairline rounded-lg px-3 h-10 text-sm text-ink focus:outline-none focus:border-forest"
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {LEVEL_LABEL[opt]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </fieldset>
  );
}
