"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastIdCounter = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = toastIdCounter++;
    setToasts((prev) => [...prev, { id, message, variant }]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container - bottom right, just above player */}
      <div className="fixed bottom-28 right-4 z-[70] pointer-events-none">
        <div className="flex flex-col items-end gap-2 max-w-sm w-full">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto rounded-xl px-3 py-2.5 text-sm shadow-lg border border-white/10 max-w-xs w-full sm:w-auto sm:min-w-[220px] sm:max-w-[320px] bg-black/90 text-white"
            >
              <p className="truncate">{toast.message}</p>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}


