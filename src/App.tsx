import { useEffect, useState } from "react";
import { logout, me, type User } from "./api";
import AuthScreen from "./AuthScreen";
import Dashboard from "./Dashboard";
import SquadTab from "./SquadTab";

type Tab = "search" | "squad";

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("search");

  useEffect(() => {
    me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) return null;
  if (!user) return <AuthScreen onAuthed={setUser} />;

  return (
    <div className="min-h-screen flex bg-[#08080a]">
      <aside className="w-64 border-r border-white/[0.05] bg-[#0c0c0f]/80 backdrop-blur-2xl flex flex-col justify-between py-7 px-5 fixed inset-y-0 z-50">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center shadow-inner">
              <span className="text-sm">🤝</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-white leading-tight">HiredTogether</span>
              <span className="text-[11px] font-medium text-white/40">Job hunt, with backup</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <NavItem label="My Search" icon="🗂️" active={tab === "search"} onClick={() => setTab("search")} />
            <NavItem label="Squad" icon="👥" active={tab === "squad"} onClick={() => setTab("squad")} />
          </nav>
        </div>

        <div className="px-2 pt-4 border-t border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-xs font-medium text-white/80 truncate">{user.name}</span>
          </div>
          <button
            className="text-white/40 hover:text-white transition-colors text-xs"
            title="Sign out"
            onClick={() => logout().then(() => setUser(null))}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 min-h-screen px-12 lg:px-20 py-12 max-w-6xl">
        {tab === "search" ? <Dashboard user={user} /> : <SquadTab user={user} />}
      </main>
    </div>
  );
}

function NavItem({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all text-left ${
        active ? "bg-white/[0.07] text-white font-medium" : "text-white/50 hover:text-white hover:bg-white/[0.03] font-normal"
      }`}
    >
      <span className="text-[15px]">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
