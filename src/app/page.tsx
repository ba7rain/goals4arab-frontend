"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJSON, DateResp, Fixture } from "@/lib/api";
import MatchRow from "@/components/MatchRow";

type LeagueOpt = { id: number; label: string };

export default function Home() {
  // date state
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  // fixtures
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // league filter
  const [league, setLeague] = useState<number | "all">("all");

  // build league options from fixtures
  const leagues: LeagueOpt[] = useMemo(() => {
    const map = new Map<number, string>();
    for (const f of fixtures) {
      const label = f.league_name || `الدوري #${f.league_id}`;
      map.set(f.league_id, label);
    }
    return Array.from(map, ([id, label]) => ({ id, label })).sort((a, b) =>
      a.label.localeCompare(b.label, "ar")
    );
  }, [fixtures]);

  const filtered = useMemo(
    () => (league === "all" ? fixtures : fixtures.filter((f) => f.league_id === league)),
    [fixtures, league]
  );

  async function loadForDate(d: string) {
    setLoading(true);
    try {
      const res = await fetchJSON<DateResp>(`/api/fixtures/date/${d}`);
      setFixtures(res.fixtures ?? []);
      setLastUpdated(new Date());
    } catch {
      setFixtures([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let stop = false;
    const run = async () => { if (!stop) await loadForDate(date); };
    run();
    const t = setInterval(run, 30_000);
    return () => { stop = true; clearInterval(t); };
  }, [date]);

  // prev/next/today helpers
  const prevDay = () => {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() - 1);
    setDate(d.toISOString().slice(0, 10));
  };
  const nextDay = () => {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + 1);
    setDate(d.toISOString().slice(0, 10));
  };
  const today = () => setDate(new Date().toISOString().slice(0, 10));

  const since = useMemo(() => {
    if (!lastUpdated) return "";
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (diff < 60) return `آخر تحديث قبل ${diff} ثانية`;
    const mins = Math.floor(diff / 60);
    return `آخر تحديث قبل ${mins} دقيقة`;
  }, [lastUpdated]);

  return (
    <main>
      {/* Sticky header with date + nav + league filter */}
      <header className="header">
        <div className="header-inner">
          <h1 className="text-xl font-bold">Goals4Arab</h1>

          <div className="controls">
            <button className="nav-btn" onClick={prevDay}>أمس</button>
            <button className="nav-btn" onClick={today}>اليوم</button>
            <button className="nav-btn" onClick={nextDay}>غدًا</button>

            <input
              type="date"
              className="date-input"
              dir="ltr"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <select
              className="select"
              value={league === "all" ? "all" : String(league)}
              onChange={(e) => {
                const v = e.target.value;
                setLeague(v === "all" ? "all" : Number(v));
              }}
            >
              <option value="all">كل الدوريات</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="header-inner pt-0">
          <div className="text-xs text-gray-500">{since}</div>
        </div>
      </header>

      <section className="section">
        <h2 className="section-title">مباريات يوم {date}</h2>

        {loading ? (
          <div className="empty">...جاري التحميل</div>
        ) : filtered.length === 0 ? (
          <div className="empty">لا توجد مباريات لهذا الاختيار</div>
        ) : (
          <div className="list">
            {filtered.map((f) => <MatchRow key={f.id} f={f} />)}
          </div>
        )}
      </section>

      <footer className="footer">© {new Date().getFullYear()} Goals4Arab</footer>
    </main>
  );
}
