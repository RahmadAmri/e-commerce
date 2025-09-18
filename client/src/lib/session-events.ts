const EVENT = "session:changed";
const STORAGE_KEY = "__session_changed__";

export type SessionChange = { loggedIn: boolean };

export function emitSessionChange(loggedIn: boolean) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ loggedIn, ts: Date.now() })
    );
  } catch {}
  window.dispatchEvent(
    new CustomEvent<SessionChange>(EVENT, { detail: { loggedIn } })
  );
}

export function listenSessionChange(cb: (loggedIn: boolean) => void) {
  const onEvt = (e: Event) => {
    const d = (e as CustomEvent<SessionChange>).detail;
    if (d && typeof d.loggedIn === "boolean") cb(d.loggedIn);
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const d = JSON.parse(e.newValue) as { loggedIn?: boolean };
      if (typeof d.loggedIn === "boolean") cb(d.loggedIn);
    } catch {}
  };
  window.addEventListener(EVENT, onEvt as EventListener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onEvt as EventListener);
    window.removeEventListener("storage", onStorage);
  };
}
