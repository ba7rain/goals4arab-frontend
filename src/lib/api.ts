const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export type Team = { id:number; name:string; code?:string; logo?:string };
export type Fixture = {
  id:number;
  league_id:number;
  state_id:number; // 1 scheduled, 2 live...
  kickoff_utc:string | null;
  kickoff_bahrain:string | null;
  home: Team; away: Team;
  score_home:number; score_away:number;
};

export async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

export type TodayResp = { date_utc:string; fixtures: Fixture[] };
export type LiveResp  = { count:number; fixtures: Fixture[] };
export type DateResp  = { date_utc:string; fixtures: Fixture[] };
export type UpResp    = { days:number; schedule: { date_utc:string; fixtures: Fixture[] }[] };
