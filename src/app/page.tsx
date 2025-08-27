"use client";

import { useEffect, useState, useMemo } from "react";
import MatchRow from "@/components/MatchRow";
import { fetchJSON, Fixture } from "@/lib/api";

export default function Home() {
  // selected date (YYYY-MM-DD), default = today UTC
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // formatted “last updated”
  const since = useMemo(() => {
    if (!lastUpdated) return "";
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (diff < 60) return `آخر تحديث قبل ${diff} ثانية`;
    const mins = Math.floor(diff / 60);
    return `آخر تحديث قبل ${mins} دقيقة`;
  }, [lastUpdated]);

  // load fixtures for the selected date
  async function loadForDate(d: string) {
    setLoading(true);
    try {
      const res = await fetchJSON<{ date_utc: string; fixtures: Fixture[] }>(`/api/fixtures/date/${d}`);
      setFixtures(res.fixtures ?? []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setFixtures([]);
    } finally {
      setLoading(false);
    }
  }

  // initial load + refresh every 30s for the selected date
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await loadForDate(date);
    };

    run();
    const t = setInterval(run, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [date]); // re-run when the date changes

  return (
    <main>
      {/* Header with date picker at the very top */}
      <header className="header">
        <div className="header-inner">
          <h1 className="text-2xl font-bold">Goals4Arab</h1>

          {/* date picker */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">اختر التاريخ:</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm"
              dir="ltr"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* last updated */}
        <div className="header-inner pt-0">
          <div className="text-xs text-gray-500">{since}</div>
        </div>
      </header>

      {/* Single section that shows ONLY the selected date */}
      <section className="section">
        <h2 className="section-title">مباريات يوم {date}</h2>

        {loading ? (
          <div className="empty">...جاري التحميل</div>
        ) : fixtures.length === 0 ? (
          <div className="empty">لا توجد مباريات في هذا التاريخ</div>
        ) : (
          <div className="list">
            {fixtures.map((f) => (
              <MatchRow key={f.id} f={f} />
            ))}
          </div>
        )}
      </section>

      <footer className="footer">© {new Date().getFullYear()} Goals4Arab</footer>
    </main>
  );
}
