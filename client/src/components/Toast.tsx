"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type ToastType = "success" | "error" | "info";
type ShowOpts = { type?: ToastType; duration?: number };

type Ctx = {
  show: (message: string, opts?: ShowOpts) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const idRef = useRef(1);
  const [toasts, setToasts] = useState<
    { id: number; msg: string; type: ToastType }[]
  >([]);

  const remove = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const show = useCallback((msg: string, opts?: ShowOpts) => {
    const id = idRef.current++;
    const type = opts?.type ?? "info";
    const duration = opts?.duration ?? 1800;
    setToasts((t) => [...t, { id, msg, type }]);
    const timer = setTimeout(() => remove(id), duration);
    return () => clearTimeout(timer);
  }, []);

  const success = (msg: string, duration?: number) =>
    show(msg, { type: "success", duration });
  const error = (msg: string, duration?: number) =>
    show(msg, { type: "error", duration });
  const info = (msg: string, duration?: number) =>
    show(msg, { type: "info", duration });

  return (
    <ToastCtx.Provider value={{ show, success, error, info }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto w-72 rounded-md border px-3 py-2 shadow-lg",
              "transform transition-all duration-200 ease-out",
              "bg-neutral-900 text-white border-neutral-800",
              t.type === "success" ? "border-green-600/50" : "",
              t.type === "error" ? "border-red-600/50" : "",
              t.type === "info" ? "border-blue-600/50" : "",
            ].join(" ")}
            style={{ animation: "toast-enter 150ms ease-out" }}
          >
            <div className="flex items-center gap-2">
              <span
                className={
                  t.type === "success"
                    ? "text-green-400"
                    : t.type === "error"
                    ? "text-red-400"
                    : "text-blue-400"
                }
              >
                {t.type === "success" ? "✓" : t.type === "error" ? "!" : "i"}
              </span>
              <span className="text-sm">{t.msg}</span>
            </div>
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes toast-enter {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </ToastCtx.Provider>
  );
}

export function useToast(): Ctx {
  const ctx = useContext(ToastCtx);
  if (ctx) return ctx;
  // Tolerant fallback (no crash if provider not mounted)
  const noop = () => {};
  return {
    show: () => noop(),
    success: () => noop(),
    error: () => noop(),
    info: () => noop(),
  };
}
