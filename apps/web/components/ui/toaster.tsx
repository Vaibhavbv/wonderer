"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Safe outside the provider (e.g. a component rendered in isolation in a
// test): falls back to a no-op rather than throwing.
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  return ctx ?? { toast: () => {} };
}

const ICONS: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const KIND_CLASSES: Record<ToastKind, string> = {
  success: "border-success/40 text-success",
  error: "border-error/40 text-error",
  info: "border-primary-500/40 text-primary-400",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const prefersReduced = useReducedMotion();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2"
      >
        <AnimatePresence>
          {toasts.map(({ id, kind, message }) => {
            const Icon = ICONS[kind];
            return (
              <motion.div
                key={id}
                role="status"
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface-elevated px-4 py-3 shadow-lg",
                  KIND_CLASSES[kind],
                )}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="flex-1 text-sm text-text-primary">{message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(id)}
                  aria-label="Dismiss notification"
                  className="text-text-tertiary transition-colors hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
