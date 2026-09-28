import { useEffect, useState } from "react";
import { createSquad, getSquad, joinSquad, type Squad, type SquadMember, type User } from "./api";

export default function SquadTab({ user }: { user: User }) {
  const [squad, setSquad] = useState<Squad | null | undefined>(undefined);
  const [members, setMembers] = useState<SquadMember[]>([]);

  function refresh() {
    getSquad().then(({ squad, members }) => {
      setSquad(squad);
      setMembers(members ?? []);
    });
  }

  useEffect(refresh, []);

  if (squad === undefined) return <p className="text-sm text-white/40 pt-10">Loading…</p>;

  return (
    <div className="flex flex-col w-full">
      <div className="pb-10 border-b border-white/[0.04]">
        <p className="text-xs font-medium tracking-widest uppercase text-white/40 mb-1.5">Accountability</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">Squad</h1>
        <p className="text-xs text-white/50 mt-1">Track progress together, cheer each other on.</p>
      </div>

      {squad ? (
        <div className="py-10 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-[#0f0f13] border border-white/[0.05] flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">{squad.name}</h2>
              <p className="text-xs text-white/40 mt-0.5">{members.length} member{members.length === 1 ? "" : "s"}</p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-white/70">
              <span className="text-white/40">Invite code</span>
              <span className="font-semibold tracking-wider text-white">{squad.invite_code}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((m) => (
              <div key={m.id} className="p-6 rounded-2xl bg-[#0f0f13] border border-white/[0.05] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold flex items-center justify-center text-white">
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {m.name} {m.id === user.id && <span className="text-white/30 text-xs">(you)</span>}
                      </p>
                      <p className="text-xs text-white/40">{m.title || "Job seeker"}</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/40">{m.total} total</span>
                </div>
                {m.total > 0 ? (
                  <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden flex">
                    <div className="h-full bg-[#34d399]" style={{ width: `${(m.offers / m.total) * 100}%` }} title={`Offers: ${m.offers}`} />
                    <div className="h-full bg-[#fbbf24]" style={{ width: `${(m.interviews / m.total) * 100}%` }} title={`Interviews: ${m.interviews}`} />
                    <div className="h-full bg-white/30" style={{ width: `${(m.applied / m.total) * 100}%` }} title={`Applied: ${m.applied}`} />
                    <div className="h-full bg-[#f87171]" style={{ width: `${(m.rejected / m.total) * 100}%` }} title={`Closed: ${m.rejected}`} />
                  </div>
                ) : (
                  <p className="text-xs text-white/30">No applications logged yet.</p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-white/50">
                  <span className="text-emerald-400">{m.offers} offers</span>
                  <span className="text-amber-400">{m.interviews} interviews</span>
                  <span>{m.applied} applied</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <SquadSetup onDone={refresh} />
      )}
    </div>
  );
}

function SquadSetup({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "create") await createSquad(name);
      else await joinSquad(code);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-10 max-w-md">
      <div className="p-7 rounded-2xl bg-[#0f0f13] border border-white/[0.05]">
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-full border border-white/[0.05] text-[11px] w-fit mb-6">
          <button
            onClick={() => setMode("create")}
            className={`px-3 py-1 rounded-full transition-colors ${mode === "create" ? "bg-white/[0.1] text-white font-medium" : "text-white/50"}`}
          >
            Create a squad
          </button>
          <button
            onClick={() => setMode("join")}
            className={`px-3 py-1 rounded-full transition-colors ${mode === "join" ? "bg-white/[0.1] text-white font-medium" : "text-white/50"}`}
          >
            Join with code
          </button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "create" ? (
            <input
              className="h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
              placeholder="Squad name, e.g. The 2026 Hunt"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          ) : (
            <input
              className="h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 uppercase tracking-wider"
              placeholder="Invite code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          )}
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="h-10 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-all disabled:opacity-50"
          >
            {loading ? "Working…" : mode === "create" ? "Create squad" : "Join squad"}
          </button>
        </form>
      </div>
    </div>
  );
}
