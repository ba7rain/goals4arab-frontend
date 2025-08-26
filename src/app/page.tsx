"use client";

import { useEffect, useState } from "react";
import MatchCard from "@/components/MatchCard";
import { fetchJSON, LiveResp, TodayResp, UpResp, Fixture } from "@/lib/api";

type SectionProps = { title: string; items: Fixture[]; emptyText?: string };
function Section({ title, items, emptyText }: SectionProps) {
  return (
    <section className="container my-6">
      <h2 className="section-title">{title}</h2>
      {items.length === 0 ? (
        <div className="card text-sm text-gray-600">{emptyText ?? "لا توجد عناصر"}</div>
      ) : (
        <div className="grid gap-3">
          {items.map((f) => <MatchCard key={f.id} f={f} />)}
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [liveRes, todayRes] = await Promise.all([
          fetchJSON<LiveResp>("/api/live"),
          fetchJSON<TodayResp>("/api/fixtures/today"),
        ]);

        if (cancelled) return;
        setLive(liveRes.fixtures ?? []);
        setToday(todayRes.fixtures ?? []);
        setTodayDate(todayRes.date_utc ?? "");

        // If no matches today, auto-fallback to tomorrow and upcoming
        if (!todayRes.fixtures || todayRes.fixtures.length === 0) {
          const tomorrow = await fetchJSON<TodayResp>("/api/fixtures/tomorrow");
          if (cancelled) return;
          setFallbackDate(tomorrow.date_utc ?? null);
          setToday(tomorrow.fixtures ?? []);

          // also show the next 7 days compact schedule
          const up = await fetchJSON<UpResp>("/api/fixtures/upcoming?days=7");
          if (!cancelled) setUpcoming(up.schedule ?? []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const t = setInterval(load, 30_000); // refresh every 30s for live
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <main className="pb-16">
      <header className="bg-white/80 backdrop-blur border-b">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Goals4Arab</h1>
          <div className="text-sm text-gray-500">نتائج مباشرة ومباريات اليوم</div>
        </div>
      </header>

      {loading ? (
        <section className="container my-8">
          <div className="card animate-pulse h-20" />
          <div className="card animate-pulse h-20 mt-3" />
        </section>
      ) : (
        <>
          <Section
            title="المباريات المباشرة الآن"
            items={live}
            emptyText="لا توجد مباريات مباشرة الآن"
          />

          <Section
            title={fallbackDate ? `مباريات يوم ${fallbackDate}` : `مباريات اليوم (${todayDate})`}
            items={today}
            emptyText="لا توجد مباريات اليوم"
          />

          {upcoming.length > 0 && (
            <section className="container my-6">
              <h2 className="section-title">خلال ٧ أيام قادمة</h2>
              <div className="grid gap-6">
                {upcoming.map((d) => (
                  <div key={d.date_utc} className="space-y-2">
                    <div className="text-sm text-gray-500">{d.date_utc}</div>
                    <div className="grid gap-3">
                      {d.fixtures.map((f) => <MatchCard key={f.id} f={f} />)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <footer className="container my-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Goals4Arab
      </footer>
    </main>
  );
}
