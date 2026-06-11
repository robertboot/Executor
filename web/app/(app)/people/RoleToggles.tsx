'use client';

import { useState } from 'react';
import { STATUS_LABEL, STATUS_OPTIONS } from '@/lib/inheritors';
import {
  LEVEL_LABEL,
  LEVEL_OPTIONS,
} from '@/lib/conservators';

type Status = (typeof STATUS_OPTIONS)[number];
type Level = (typeof LEVEL_OPTIONS)[number];

export default function RoleToggles({
  originator,
  inheritor,
  conservator,
}: {
  originator: boolean;
  inheritor: { id: string; status: Status } | null;
  conservator: { id: string; permission_level: Level } | null;
}) {
  const [isOriginator, setIsOriginator] = useState(originator);
  const [alsoInheritor, setAlsoInheritor] = useState(!!inheritor);
  const [inheritorStatus, setInheritorStatus] = useState<Status>(
    inheritor?.status ?? 'designated_heir',
  );
  const [alsoConservator, setAlsoConservator] = useState(!!conservator);
  const [conservatorLevel, setConservatorLevel] = useState<Level>(
    conservator?.permission_level ?? 'viewer',
  );

  const noRoles = !isOriginator && !alsoInheritor && !alsoConservator;

  return (
    <fieldset className="space-y-3 border-t border-hairline pt-6">
      <legend className="font-serif text-lg text-ink">Roles</legend>
      <p className="text-xs text-muted leading-relaxed -mt-1">
        This person appears in the sections you check below — they can be an
        Originator, an Inheritor (future recipient), and / or a Conservator
        (helper with archive access). Turning an Inheritor or Conservator
        toggle off only unlinks the row; it&rsquo;s left for you to clean up
        from its own page.
      </p>

      {/* Originator toggle */}
      <div className="bg-paper border border-hairline rounded-xl p-4">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="is_originator"
            value="1"
            checked={isOriginator}
            onChange={(e) => setIsOriginator(e.target.checked)}
            className="h-4 w-4 accent-forest"
          />
          <span className="font-medium text-ink">Originator</span>
          <span className="text-xs text-muted">
            — appears in your Originators list
          </span>
        </label>
      </div>

      {/* Inheritor toggle */}
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
              onChange={(e) => setInheritorStatus(e.target.value as Status)}
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

      {/* Conservator toggle */}
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
              onChange={(e) => setConservatorLevel(e.target.value as Level)}
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

      {noRoles && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
          No roles selected — saving will remove this person from your
          archive.
        </p>
      )}
    </fieldset>
  );
}
