"use client";

import { useEffect, useState } from "react";
import { fetchJSON, LiveResp, TodayResp, UpResp, Fixture } from "@/lib/api";
import MatchRow from "@/components/MatchRow";

function Section({ title, items, empty }: { title: string; items: Fixture[]; empty: string }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      {items.length === 0 ? (
        <div className="empty">{empty}</div>
      ) : (
        <div className="list">
          {items.map((f) => (
            <MatchRow key={f.id} f={f} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  // existing sections
  const [live, setLive] = useState<Fixture[]>([]);
  const [today, setToday] = useState<Fixture[]>([]);
  const [todayDate, setTodayDate] = useState<string>("");
  const [fallbackDate, setFallbackDate] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<UpResp["schedule"]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // NEW: calendar (date picker) state
  const [pickedDate, setPickedDate] = useState<string>(""); // YYYY-MM-DD
  const [pickedFixtures, setPickedFixtures] = useState<Fixture[]>([]);
  const [pickedLoading, setPickedLoading] = useState(false);

  // helper: human “last updated”
  function since() {
    if (!lastUpdated) return "";
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (diff < 60) return `آخر تحديث قبل ${diff} ثانية`;
    const mins = Math.floor(diff / 60);
    return `آخر تحديث قبل ${mins} دقيقة`;
  }

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
    const t = setInterval(() => {
      if (!stop) loadAll();
    }, 30_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  // NEW: when user picks a date, fetch that day’s fixtures
  async function onPickDate(value: string) {
    setPickedDate(value);
    if (!value) {
      setPickedFixtures([]);
      return;
    }
    try {
      setPickedLoading(true);
      const data = await fetchJSON<{ date_utc: string; fixtures: Fixture[] }>(
        `/api/fixtures/date/${value}`
      );
      setPickedFixtures(data.fixtures ?? []);
    } catch (e) {
      console.error(e);
      setPickedFixtures([]);
    } finally {
      setPickedLoading(false);
    }
  }

  // default date input value = today in UTC (YYYY-MM-DD)
  useEffect(() => {
    const todayUtc = new Date().toISOString().slice(0, 10);
    setPickedDate(todayUtc);
    // auto-load today for the date picker (optional)
    onPickDate(todayUtc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          {/* LIVE */}
          <Section title="المباريات المباشرة الآن" items={live} empty="لا توجد مباريات مباشرة الآن" />

          {/* TODAY (or tomorrow fallback) */}
          <Section
            title={fallbackDate ? `مباريات يوم ${fallbackDate}` : `مباريات اليوم (${todayDate})`}
            items={today}
            empty="لا توجد مباريات اليوم"
          />

          {/* UPCOMING (only if today is empty) */}
          {upcoming.length > 0 && (
            <section className="section">
              <h2 className="section-title">خلال ٧ أيام قادمة</h2>
              <div className="list">
                {upcoming.map((d) => (
                  <div key={d.date_utc} className="py-2">
                    <div className="text-sm text-gray-500 mb-2">{d.date_utc}</div>
                    <div className="divide-y">
                      {d.fixtures.map((f) => (
                        <MatchRow key={f.id} f={f} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* NEW: Calendar picker section */}
          <section className="section">
            <h2 className="section-title">اختر تاريخًا لعرض المباريات</h2>

            <div className="mb-3">
              <input
                type="date"
                className="border rounded-lg px-3 py-2 text-sm"
                dir="ltr"
                value={pickedDate}
                onChange={(e) => onPickDate(e.target.value)}
              />
            </div>

            {pickedLoading ? (
              <div className="empty">...جاري تحميل مباريات هذا التاريخ</div>
            ) : (
              <div className="list">
                {pickedFixtures.length === 0 ? (
                  <div className="empty">لا توجد مباريات في هذا التاريخ</div>
                ) : (
                  pickedFixtures.map((f) => <MatchRow key={f.id} f={f} />)
                )}
              </div>
            )}
          </section>
        </>
      )}

      <footer className="footer">© {new Date().getFullYear()} Goals4Arab</footer>
    </main>
  );
}
