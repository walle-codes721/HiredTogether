import { useEffect, useMemo, useState } from "react";
import {
  createApplication,
  deleteApplication,
  listApplications,
  updateApplication,
  type Application,
  type Status,
  type User,
} from "./api";

const STATUS_META: Record<Status, { label: string; dot: string; badge: string }> = {
  applied: { label: "Applied", dot: "bg-white/40", badge: "bg-white/[0.08] text-white/70 border-white/10" },
  interview: { label: "Interview", dot: "bg-[#fbbf24]", badge: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
  offer: { label: "Offer", dot: "bg-[#34d399]", badge: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
  rejected: { label: "Closed", dot: "bg-[#f87171]", badge: "bg-rose-400/10 text-rose-400 border-rose-400/20" },
};

const STATUS_ORDER: Status[] = ["applied", "interview", "offer", "rejected"];

export default function Dashboard({ user }: { user: User }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);

  useEffect(() => {
    listApplications()
      .then(({ applications }) => setApplications(applications))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { applied: 0, interview: 0, offer: 0, rejected: 0 };
    for (const a of applications) c[a.status]++;
    return c;
  }, [applications]);

  const total = applications.length;
  const visible = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  async function handleSave(data: Partial<Application>) {
    if (editing) {
      const { application } = await updateApplication(editing.id, data);
      setApplications((prev) => prev.map((a) => (a.id === application.id ? application : a)));
    } else {
      const { application } = await createApplication(data);
      setApplications((prev) => [application, ...prev]);
    }
    setShowModal(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    await deleteApplication(id);
    setApplications((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-white/[0.04]">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-white/40 mb-1.5">My Search</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="text-xs text-white/50 mt-1">
            {user.name} <span className="text-white/20">·</span> {user.title || "Job seeker"}{" "}
            <span className="text-white/20">·</span> {total} active applications
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="h-9 px-4 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 self-start"
        >
          + New Application
        </button>
      </div>

      <section className="py-10 border-b border-white/[0.04]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Offers Received" value={counts.offer} color="emerald" hint={`${counts.interview} in interviews`} />
          <StatCard label="In Progress" value={counts.applied + counts.interview} color="amber" hint={`${counts.interview} interviewing`} />
          <StatCard label="Closed / Rejected" value={counts.rejected} color="rose" hint={total ? `${Math.round((counts.rejected / total) * 100)}% of total` : "—"} />
        </div>
      </section>

      {total > 0 && (
        <section className="py-8 border-b border-white/[0.04]">
          <div className="p-7 rounded-2xl bg-[#0f0f13] border border-white/[0.05] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Pipeline Balance</h2>
              <span className="text-xs text-white/40">{total} total applications</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-white/[0.04] overflow-hidden flex">
              {STATUS_ORDER.map((s) => (
                <div
                  key={s}
                  className={`h-full ${STATUS_META[s].dot}`}
                  style={{ width: `${(counts[s] / total) * 100}%` }}
                  title={`${STATUS_META[s].label}: ${counts[s]}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-8 flex flex-col gap-6 min-w-0">
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-full border border-white/[0.05] text-[11px] w-full sm:w-fit overflow-x-auto">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")} label={`All (${total})`} />
          {STATUS_ORDER.map((s) => (
            <FilterTab key={s} active={filter === s} onClick={() => setFilter(s)} label={`${STATUS_META[s].label} (${counts[s]})`} />
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-white/40">Loading…</p>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/40 border border-dashed border-white/10 rounded-2xl">
            No applications here yet.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {visible.map((a) => (
              <div key={a.id} className="py-4 flex items-center justify-between group hover:bg-white/[0.015] px-2 -mx-2 rounded-xl transition-all">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.05] flex items-center justify-center font-medium text-sm text-white/80 shrink-0">
                    {a.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{a.company}</span>
                      <span className="text-xs text-white/35">·</span>
                      <span className="text-xs text-white/60 truncate">{a.role}</span>
                    </div>
                    <div className="text-xs text-white/40 mt-0.5 flex items-center gap-1.5 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[a.status].dot}`} />
                      <span className="truncate">{a.next_step || a.salary || "No notes yet"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 pl-2">
                  <span className={`px-2 sm:px-2.5 py-1 rounded-full border text-[10px] sm:text-[11px] font-semibold tracking-wide whitespace-nowrap ${STATUS_META[a.status].badge}`}>
                    {STATUS_META[a.status].label}
                  </span>
                  <button
                    className="text-white/30 hover:text-white text-xs transition-colors px-1"
                    onClick={() => {
                      setEditing(a);
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button className="text-white/30 hover:text-rose-400 text-xs transition-colors px-1" onClick={() => handleDelete(a.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <ApplicationModal
          initial={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color, hint }: { label: string; value: number; color: "emerald" | "amber" | "rose"; hint: string }) {
  const colors = {
    emerald: { text: "text-emerald-400", dot: "bg-[#34d399]", border: "hover:border-emerald-500/30" },
    amber: { text: "text-amber-400", dot: "bg-[#fbbf24]", border: "hover:border-amber-500/30" },
    rose: { text: "text-rose-400", dot: "bg-[#f87171]", border: "hover:border-rose-500/30" },
  }[color];
  return (
    <div className={`p-6 rounded-2xl bg-[#0f0f13] border border-white/[0.05] transition-all flex flex-col justify-between ${colors.border}`}>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
          <span className={`text-xs font-medium uppercase tracking-wider ${colors.text}`}>{label}</span>
        </div>
        <div className="text-4xl sm:text-5xl font-semibold tracking-tight text-white my-1">{String(value).padStart(2, "0")}</div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.04] text-xs text-white/45">{hint}</div>
    </div>
  );
}

function FilterTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full transition-colors ${active ? "bg-white/[0.1] text-white font-medium" : "text-white/50 hover:text-white"}`}
    >
      {label}
    </button>
  );
}

function ApplicationModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Application | null;
  onClose: () => void;
  onSave: (data: Partial<Application>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    company: initial?.company ?? "",
    role: initial?.role ?? "",
    status: initial?.status ?? "applied",
    salary: initial?.salary ?? "",
    next_step: initial?.next_step ?? "",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6" onClick={onClose}>
      <div
        className="w-full max-w-md p-5 sm:p-7 rounded-2xl bg-[#0f0f13] border border-white/[0.08] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-5">{initial ? "Edit Application" : "New Application"}</h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            className="h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            required
          />
          <input
            className="h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
            placeholder="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            required
          />
          <select
            className="h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-white/25"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s} className="bg-[#0f0f13]">
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
          <input
            className="h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
            placeholder="Salary (optional)"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
          />
          <input
            className="h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
            placeholder="Next step (optional)"
            value={form.next_step}
            onChange={(e) => setForm({ ...form, next_step: e.target.value })}
          />
          <textarea
            className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 resize-none"
            placeholder="Notes (optional)"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex items-center gap-2 mt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl bg-white/[0.05] text-white/70 text-sm font-medium hover:bg-white/[0.08] transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 h-10 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-all disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
