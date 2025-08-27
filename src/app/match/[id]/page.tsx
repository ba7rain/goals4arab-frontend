"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Event = {
  id: number;
  type?: { name?: string } | string;
  minute?: number | string;
  extra_minute?: number | string;
  participant_id?: number;
  player_name?: string;
  result?: string;
  // Sportmonks payload can vary; we handle gracefully
};

export default function MatchPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${base}/api/matches/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setData(json?.data ?? json); // backend returns raw Sportmonks envelope
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return (
    <main className="section">
      <div className="empty">...جاري التحميل</div>
    </main>
  );

  if (!data) return (
    <main className="section">
      <div className="empty">تعذر تحميل تفاصيل المباراة</div>
      <div className="mt-3">
        <Link className="nav-btn" href="/">العودة</Link>
      </div>
    </main>
  );

  const fx = Array.isArray(data) ? data[0] : data;
  const parts = fx?.participants ?? [];
  const home = parts.find((p:any)=>p?.meta?.location==='home');
  const away = parts.find((p:any)=>p?.meta?.location==='away');

  // score
  let homeScore = 0, awayScore = 0;
  (fx?.scores ?? []).forEach((s:any) => {
    if (s?.description === "CURRENT") {
      if (s?.score?.participant === "home") homeScore = s.score.goals ?? 0;
      if (s?.score?.participant === "away") awayScore = s.score.goals ?? 0;
    }
  });

  const kickoffUTC = fx?.starting_at ? fx.starting_at.replace(' ', 'T') + 'Z' : null;
  const kickoffBahrain = kickoffUTC
    ? new Date(kickoffUTC).toLocaleString('ar', {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Bahrain",
      })
    : "—";

  // events
  const events: Event[] = fx?.events ?? [];
  const prettyType = (t:any) => typeof t === "string" ? t : (t?.name ?? "حدث");
  const minute = (e:Event) => {
    const m = Number(e.minute ?? 0);
    const ex = Number(e.extra_minute ?? 0);
    return ex ? `${m}+${ex}` : String(m);
  };

  return (
    <main>
      <header className="header">
        <div className="header-inner">
          <Link className="nav-btn" href="/">← رجوع</Link>
          <h1 className="text-xl font-bold">تفاصيل المباراة</h1>
          <div />
        </div>
      </header>

      <section className="section">
        <div className="list">
          <div className="row">
            <div className="team">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {home?.image_path ? <img src={home.image_path} alt="" className="h-6 w-6 rounded-full" /> : <div className="h-6 w-6 rounded-full bg-gray-200" />}
              <div className="team-name">{home?.name}</div>
            </div>
            <div className="text-center min-w-[140px]">
              <div className="text-2xl font-bold tabular-nums">{homeScore} : {awayScore}</div>
              <div className="text-xs text-gray-500">{kickoffBahrain}</div>
            </div>
            <div className="team flex-row-reverse">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {away?.image_path ? <img src={away.image_path} alt="" className="h-6 w-6 rounded-full" /> : <div className="h-6 w-6 rounded-full bg-gray-200" />}
              <div className="team-name">{away?.name}</div>
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
            {events.map((e:any) => (
              <div key={e.id ?? `${e.type}-${e.minute}-${e.player_name}`} className="row">
                <div className="text-sm text-gray-500">{minute(e)}′</div>
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
