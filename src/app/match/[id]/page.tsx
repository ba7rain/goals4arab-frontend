"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SMTeam = {
  id: number;
  name?: string;
  short_code?: string;
  image_path?: string;
  meta?: { location?: "home" | "away" };
};

type SMScore = {
  id?: number;
  description?: string; // e.g., "CURRENT"
  score?: { participant?: "home" | "away"; goals?: number };
};

type SMEvent = {
  id?: number;
  type?: { name?: string } | string;
  minute?: number;
  extra_minute?: number;
  participant_id?: number;
  player_name?: string;
  result?: string;
};

type SMFixtureDetail = {
  id: number;
  starting_at?: string; // "YYYY-MM-DD HH:mm:ss"
  participants?: SMTeam[];
  scores?: SMScore[];
  events?: SMEvent[];
  league?: { id?: number; name?: string } | null;
};

type APIEnvelope<T> = { data?: T } | T;

function formatKickoffBahrain(starting_at?: string): string {
  if (!starting_at) return "—";
  const iso = starting_at.replace(" ", "T") + "Z";
  return new Date(iso).toLocaleString("ar", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bahrain",
  });
}

export default function MatchPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [fx, setFx] = useState<SMFixtureDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL ?? "";
        const res = await fetch(`${base}/api/matches/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: APIEnvelope<SMFixtureDetail | SMFixtureDetail[]> = await res.json();
        const payload = "data" in json ? json.data : json;
        const first = Array.isArray(payload) ? payload[0] : payload;
        if (!cancelled) setFx(first ?? null);
      } catch {
        if (!cancelled) setFx(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="section">
        <div className="empty">...جاري التحميل</div>
      </main>
    );
  }

  if (!fx) {
    return (
      <main className="section">
        <div className="empty">تعذر تحميل تفاصيل المباراة</div>
        <div className="mt-3">
          <Link className="nav-btn" href="/">
            ← رجوع
          </Link>
        </div>
      </main>
    );
  }

  const parts = fx.participants ?? [];
  const home = parts.find((p) => p.meta?.location === "home");
  const away = parts.find((p) => p.meta?.location === "away");

  // current score
  let homeScore = 0;
  let awayScore = 0;
  (fx.scores ?? []).forEach((s) => {
    if (s.description === "CURRENT") {
      if (s.score?.participant === "home") homeScore = s.score.goals ?? 0;
      if (s.score?.participant === "away") awayScore = s.score.goals ?? 0;
    }
  });

  const kickoffBahrain = formatKickoffBahrain(fx.starting_at);
  const events: SMEvent[] = fx.events ?? [];
  const prettyType = (t: SMEvent["type"]) =>
    typeof t === "string" ? t : t?.name ?? "حدث";
  const prettyMinute = (e: SMEvent) => {
    const m = Number(e.minute ?? 0);
    const ex = Number(e.extra_minute ?? 0);
    return ex ? `${m}+${ex}` : String(m);
  };

  return (
    <main>
      <header className="header">
        <div className="header-inner">
          <Link className="nav-btn" href="/">
            ← رجوع
          </Link>
          <h1 className="text-xl font-bold">تفاصيل المباراة</h1>
          <div />
        </div>
      </header>

      <section className="section">
        <div className="list">
          <div className="row">
            <div className="team">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {home?.image_path ? (
                <img src={home.image_path} alt="" className="h-6 w-6 rounded-full" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gray-200" />
              )}
              <div className="team-name">{home?.name ?? "—"}</div>
            </div>

            <div className="text-center min-w-[140px]">
              <div className="text-2xl font-bold tabular-nums">
                {homeScore} : {awayScore}
              </div>
              <div className="text-xs text-gray-500">{kickoffBahrain}</div>
            </div>

            <div className="team flex-row-reverse">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {away?.image_path ? (
                <img src={away.image_path} alt="" className="h-6 w-6 rounded-full" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gray-200" />
              )}
              <div className="team-name">{away?.name ?? "—"}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">الأحداث</h2>
        {events.length === 0 ? (
          <div className="empty">لا توجد أحداث</div>
        ) : (
          <div className="list">
            {events.map((e) => (
              <div key={String(e.id ?? `${e.type}-${e.minute}-${e.player_name}`)} className="row">
                <div className="text-sm text-gray-500">{prettyMinute(e)}′</div>
                <div className="text-sm">{prettyType(e.type)}</div>
                <div className="text-sm text-gray-700 truncate">{e.player_name ?? ""}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="footer">© {new Date().getFullYear()} Goals4Arab</footer>
    </main>
  );
}
