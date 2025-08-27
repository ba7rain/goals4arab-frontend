"use client";

import Link from "next/link";
import type { Fixture } from "@/lib/api";

function Badge({ state }: { state: number }) {
  if (state === 2) return <span className="badge badge-live">مباشر</span>;
  if (state === 3) return <span className="badge badge-done">انتهت</span>;
  return <span className="badge badge-soon">قريبًا</span>;
}

export default function MatchRow({ f }: { f: Fixture }) {
  return (
    <Link href={`/match/${f.id}`} className="link">
      <div className="row">
        {/* left: home */}
        <div className="team">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {f.home.logo ? <img src={f.home.logo} alt="" className="h-5 w-5 rounded-full" /> : <div className="h-5 w-5 rounded-full bg-gray-200" />}
          <div className="team-name">{f.home.name}</div>
        </div>

        {/* center: score/time */}
        <div className="text-center min-w-[110px]">
          <div className="score">{f.score_home} : {f.score_away}</div>
          <div className="kick">{f.kickoff_bahrain ?? "—"}</div>
        </div>

        {/* right: away */}
        <div className="team flex-row-reverse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {f.away.logo ? <img src={f.away.logo} alt="" className="h-5 w-5 rounded-full" /> : <div className="h-5 w-5 rounded-full bg-gray-200" />}
          <div className="team-name">{f.away.name}</div>
        </div>

        {/* badge */}
        <div className="hidden sm:block">
          <Badge state={f.state_id} />
        </div>
      </div>
    </Link>
  );
}
