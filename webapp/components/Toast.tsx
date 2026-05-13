"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const colors = {
    success: { bg: "#0a1f0a", border: "#00FF88", text: "#00FF88" },
    error: { bg: "#1f0a0a", border: "#FF4444", text: "#FF4444" },
    info: { bg: "#0a0a1f", border: "#6D5ACF", text: "#6D5ACF" },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "8px" }}>
        {toasts.map(toast => {
          const c = colors[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderLeft: `4px solid ${c.border}`,
                padding: "12px 20px",
                borderRadius: "8px",
                color: c.text,
                fontSize: "13px",
                fontFamily: "var(--font-mono)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                animation: "toastIn 0.3s ease",
                minWidth: "250px",
              }}
            >
              {toast.type === "success" && <span style={{ marginRight: "8px" }}>&#10003;</span>}
              {toast.type === "error" && <span style={{ marginRight: "8px" }}>&#10007;</span>}
              {toast.message}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
