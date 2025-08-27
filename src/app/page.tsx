"use client";

import { useEffect, useState } from "react";
import MatchRow from "@/components/MatchRow";
import { fetchJSON, LiveResp, TodayResp, UpResp, Fixture } from "@/lib/api";

function Section({ title, items, empty }: { title: string; items: Fixture[]; empty: string }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      {items.length === 0 ? (
        <div className="empty">{empty}</div>
      ) : (
        <div className="list">
          {items.map(f => <MatchRow key={f.id} f={f} />)}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [live, setLive] = useState<Fixture[]>([]);
  const [today, setToday] = useState<Fixture[]>([]);
  const [todayDate, setTodayDate] = useState<string>("");
  const [fallbackDate, setFallbackDate] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<UpResp["schedule"]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    const [liveRes, todayRes] = await Promise.all([
      fetchJSON<LiveResp>("/api/live"),
      fetchJSON<TodayResp>("/api/fixtures/today"),
    ]);

    setLive(liveRes.fixtures ?? []);
    setToday(todayRes.fixtures ?? []);
    setTodayDate(todayRes.date_utc ?? "");

    if (!todayRes.fixtures || todayRes.fixtures.length === 0) {
      const tomorrow = await fetchJSON<TodayResp>("/api/fixtures/tomorrow");
      setFallbackDate(tomorrow.date_utc ?? null);
      setToday(tomorrow.fixtures ?? []);

      const up = await fetchJSON<UpResp>("/api/fixtures/upcoming?days=7");
      setUpcoming(up.schedule ?? []);
    } else {
      setFallbackDate(null);
      setUpcoming([]);
    }

    setLastUpdated(new Date());
  }

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        await loadAll();
      } finally {
        setLoading(false);
      }
    })();
    const t = setInterval(() => { if (!stop) loadAll(); }, 30_000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  function since() {
    if (!lastUpdated) return "";
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (diff < 60) return `آخر تحديث قبل ${diff} ثانية`;
    const mins = Math.floor(diff / 60);
    return `آخر تحديث قبل ${mins} دقيقة`;
  }

  return (
    <main>
      <header className="header">
        <div className="header-inner">
          <h1 className="text-2xl font-bold">Goals4Arab</h1>
          <div className="text-xs text-gray-500">{since()}</div>
        </div>
      </header>

      {loading ? (
        <section className="section">
          <div className="empty">...جاري التحميل</div>
        </section>
      ) : (
        <>
          <Section
            title="المباريات المباشرة الآن"
            items={live}
            empty="لا توجد مباريات مباشرة الآن"
          />

          <Section
            title={fallbackDate ? `مباريات يوم ${fallbackDate}` : `مباريات اليوم (${todayDate})`}
            items={today}
            empty="لا توجد مباريات اليوم"
          />

          {upcoming.length > 0 && (
            <section className="section">
              <h2 className="section-title">خلال ٧ أيام قادمة</h2>
              <div className="list">
                {upcoming.map((d) => (
                  <div key={d.date_utc} className="py-2">
                    <div className="text-sm text-gray-500 mb-2">{d.date_utc}</div>
                    <div className="divide-y">
                      {d.fixtures.map((f) => <MatchRow key={f.id} f={f} />)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <footer className="footer">© {new Date().getFullYear()} Goals4Arab</footer>
    </main>
  );
}
