"use client";

import React from "react";
import { X, AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "default";
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function Button({
  children,
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition disabled:opacity-60 disabled:cursor-not-allowed";
  const styles =
    variant === "solid"
      ? "bg-[var(--brand)] text-white hover:opacity-90"
      : variant === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : variant === "outline"
      ? "border border-[var(--subtle)] hover:bg-white"
      : "hover:bg-white";
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default function ConfirmModal({
  open,
  title = "Confirmar acción",
  message,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  tone = "danger",
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-[min(520px,95vw)] overflow-hidden rounded-lg border border-[var(--subtle)] bg-[var(--panel)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--subtle)] px-5 py-4">
            <div className="flex items-center gap-2">
              {tone === "danger" && <AlertTriangle className="text-rose-600" size={18} />}
              <h4 className="text-sm font-semibold">{title}</h4>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-100"
              aria-label="Cerrar"
              disabled={loading}
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-5 py-4 text-sm text-slate-700">{message}</div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--subtle)] px-5 py-4">
            <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
              {cancelText}
            </Button>
            <Button
              variant={tone === "danger" ? "danger" : "solid"}
              type="button"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Eliminando…" : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}