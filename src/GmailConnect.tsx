import { useEffect, useState } from "react";
import { disconnectGmail, getGmailStatus, type GmailConnection } from "./api";

const PARAM_MESSAGES: Record<string, string> = {
  connected: "Gmail connected. New status emails will sync in automatically.",
  denied: "Gmail connection was cancelled.",
  error: "Something went wrong connecting Gmail. Please try again.",
  no_refresh_token: "Google didn't grant offline access — try disconnecting Gmail access in your Google account settings, then reconnect.",
};

export default function GmailConnect() {
  const [connection, setConnection] = useState<GmailConnection | null | undefined>(undefined);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailParam = params.get("gmail");
    if (gmailParam && PARAM_MESSAGES[gmailParam]) {
      setNotice(PARAM_MESSAGES[gmailParam]);
      window.history.replaceState({}, "", window.location.pathname);
    }
    getGmailStatus().then(({ connection }) => setConnection(connection));
  }, []);

  async function handleDisconnect() {
    setBusy(true);
    try {
      await disconnectGmail();
      setConnection(null);
    } finally {
      setBusy(false);
    }
  }

  if (connection === undefined) return null;

  return (
    <div className="p-5 rounded-2xl bg-[#0f0f13] border border-white/[0.05] flex flex-col gap-3 mb-8">
      {notice && <p className="text-xs text-emerald-300">{notice}</p>}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-lg">📬</span>
          <div>
            <p className="text-sm font-medium text-white">
              {connection ? "Gmail connected" : "Connect Gmail"}
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              {connection
                ? `${connection.email} · ${connection.last_synced_at ? `last synced ${connection.last_synced_at}` : "syncing soon"}`
                : "Auto-detect interview invites, offers, and rejections from your inbox (read-only)."}
            </p>
          </div>
        </div>
        {connection ? (
          <button
            onClick={handleDisconnect}
            disabled={busy}
            className="px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.08] text-white/70 text-xs font-medium transition-all disabled:opacity-50"
          >
            {busy ? "Disconnecting…" : "Disconnect"}
          </button>
        ) : (
          <a
            href="/api/gmail/connect"
            className="px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition-all"
          >
            Connect Gmail
          </a>
        )}
      </div>
    </div>
  );
}
