"use client";

import type { Fixture } from "@/lib/api";

function badge(state_id: number) {
  if (state_id === 2) return <span className="badge badge-live">مباشر</span>;
  if (state_id === 3) return <span className="badge bg-green-100 text-green-700">انتهت</span>;
  return <span className="badge badge-scheduled">قريبًا</span>;
}

export default function MatchCard({ f }: { f: Fixture }) {
  return (
    <div className="card flex items-center justify-between gap-3">
      {/* Home */}
      <div className="flex items-center gap-2 min-w-0">
        {f.home.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.home.logo} alt={f.home.name} className="h-6 w-6 rounded-full border" />
        ) : <div className="h-6 w-6 rounded-full bg-gray-200" />}
        <div className="truncate font-medium">{f.home.name}</div>
      </div>

      {/* Score / Time */}
      <div className="text-center min-w-[110px]">
        <div className="text-2xl font-bold tabular-nums">
          {typeof f.score_home === "number" ? f.score_home : 0}
          {" : "}
          {typeof f.score_away === "number" ? f.score_away : 0}
        </div>
        <div className="text-xs text-gray-500">
          {f.kickoff_bahrain ?? "—"}
        </div>
      </div>

      {/* Away */}
      <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
        {f.away.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.away.logo} alt={f.away.name} className="h-6 w-6 rounded-full border" />
        ) : <div className="h-6 w-6 rounded-full bg-gray-200" />}
        <div className="truncate font-medium">{f.away.name}</div>
      </div>

      {/* Badge */}
      <div className="hidden sm:block">{badge(f.state_id)}</div>
    </div>
  );
}
