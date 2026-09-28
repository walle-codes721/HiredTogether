export interface User {
  id: string;
  email: string;
  name: string;
  title: string;
}

export type Status = "applied" | "interview" | "offer" | "rejected";

export interface Application {
  id: string;
  company: string;
  role: string;
  status: Status;
  salary: string;
  notes: string;
  next_step: string;
  next_step_at: string;
  created_at: string;
  updated_at: string;
}

export interface Squad {
  id: string;
  name: string;
  invite_code: string;
}

export interface SquadMember {
  id: string;
  name: string;
  title: string;
  offers: number;
  interviews: number;
  applied: number;
  rejected: number;
  total: number;
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: { "content-type": "application/json", ...options.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Something went wrong.");
  return body as T;
}

export const signup = (data: { email: string; password: string; name: string; title?: string }) =>
  api<{ user: User }>("/auth/signup", { method: "POST", body: JSON.stringify(data) });

export const login = (data: { email: string; password: string }) =>
  api<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(data) });

export const logout = () => api<{ ok: true }>("/auth/logout", { method: "POST" });

export const me = () => api<{ user: User }>("/auth/me");

export const listApplications = () => api<{ applications: Application[] }>("/applications");

export const createApplication = (data: Partial<Application>) =>
  api<{ application: Application }>("/applications", { method: "POST", body: JSON.stringify(data) });

export const updateApplication = (id: string, data: Partial<Application>) =>
  api<{ application: Application }>(`/applications/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const deleteApplication = (id: string) =>
  api<{ ok: true }>(`/applications/${id}`, { method: "DELETE" });

export const getSquad = () => api<{ squad: Squad | null; members?: SquadMember[] }>("/squad");

export const createSquad = (name: string) =>
  api<{ squad: Squad }>("/squad/create", { method: "POST", body: JSON.stringify({ name }) });

export const joinSquad = (invite_code: string) =>
  api<{ squad: Squad }>("/squad/join", { method: "POST", body: JSON.stringify({ invite_code }) });

export interface GmailConnection {
  email: string;
  connected_at: string;
  last_synced_at: string | null;
}

export const getGmailStatus = () => api<{ connected: boolean; connection: GmailConnection | null }>("/gmail/status");

export const disconnectGmail = () => api<{ ok: true }>("/gmail/disconnect", { method: "POST" });
