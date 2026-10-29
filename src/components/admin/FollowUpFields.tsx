"use client";

import { useState } from "react";
import { addDays, istDateString } from "@/lib/booking/slots";

/** Date field with 30 / 90 day shortcuts, for the follow-up reminder form. */
export function FollowUpFields({ defaultDate, defaultDone }: { defaultDate: string | null; defaultDone: boolean }) {
  const [date, setDate] = useState(defaultDate ?? "");
  const from = istDateString(new Date());
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="follow_up_on" className="mb-1.5 block text-sm font-semibold text-charcoal">Check in on</label>
        <input id="follow_up_on" name="follow_up_on" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
        <div className="mt-2 flex flex-wrap gap-2">
          {[30, 90].map((n) => (
            <button key={n} type="button" onClick={() => setDate(addDays(from, n))} className="min-h-9 rounded-full border border-gold bg-white-warm px-3 text-xs font-semibold text-maroon hover:bg-parchment">
              In {n} days
            </button>
          ))}
          <button type="button" onClick={() => setDate("")} className="min-h-9 rounded-full px-3 text-xs font-semibold text-ink-soft hover:underline">
            Clear
          </button>
        </div>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="follow_up_done" defaultChecked={defaultDone} className="mt-0.5 h-5 w-5 accent-maroon" />
        <span className="font-semibold text-charcoal">Follow-up done</span>
      </label>
    </div>
  );
}
