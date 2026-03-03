"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FileText, UploadCloud, XCircle, Trash2 } from "lucide-react";

type Props = {
  value: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number; // default 5
  maxSizeMB?: number; // default 10
  className?: string;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function uniqueMerge(prev: File[], next: File[]) {
  const seen = new Set(prev.map((f) => `${f.name}__${f.size}`));
  const merged = [...prev];
  for (const f of next) {
    const key = `${f.name}__${f.size}`;
    if (!seen.has(key)) {
      merged.push(f);
      seen.add(key);
    }
  }
  return merged;
}

function rejectionToText(r: FileRejection) {
  const codes = r.errors.map((e) => e.code);
  if (codes.includes("file-invalid-type")) return "Solo se permiten PDF.";
  if (codes.includes("file-too-large")) return "El archivo excede el tamaño máximo.";
  if (codes.includes("too-many-files")) return "Excede el número máximo de archivos.";
  return r.errors[0]?.message || "Archivo inválido.";
}

export default function DocumentDropzone({
  value,
  onChange,
  disabled = false,
  maxFiles = 5,
  maxSizeMB = 10,
  className = "",
}: Props) {
  const reduceMotion = useReducedMotion();
  const [rejected, setRejected] = useState<FileRejection[]>([]);

  const maxSize = useMemo(() => maxSizeMB * 1024 * 1024, [maxSizeMB]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (disabled) return;

      setRejected(fileRejections);

      if (acceptedFiles?.length) {
        const merged = uniqueMerge(value, acceptedFiles).slice(0, maxFiles);
        onChange(merged);
      }
    },
    [disabled, value, onChange, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles,
    maxSize,
    disabled,
    multiple: true,
  });

  const borderTone = isDragReject
    ? "border-rose-300"
    : isDragActive
    ? "border-[var(--brand)]"
    : "border-[var(--subtle)]";

  const bgTone = isDragReject ? "bg-rose-50" : isDragActive ? "bg-[var(--brand)]/5" : "bg-white";

  return (
    <div className={className}>
      <motion.div
        layout
        {...getRootProps()}
        className={[
          "rounded-md border border-dashed",
          borderTone,
          bgTone,
          "p-6 text-center",
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
        initial={false}
        animate={reduceMotion ? {} : { scale: isDragActive ? 1.01 : 1 }}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24 }}
      >
        <input {...getInputProps()} />

        <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full border border-[var(--subtle)] bg-white">
          {isDragReject ? <XCircle className="text-rose-600" size={18} /> : <UploadCloud className="text-slate-700" size={18} />}
        </div>

        <div className="text-sm font-medium text-slate-800">
          {isDragReject
            ? "Archivo inválido"
            : isDragActive
            ? "Suelta los PDF aquí…"
            : "Arrastra aquí archivos PDF o haz clic para seleccionar"}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Máx. {maxFiles} archivos • {maxSizeMB}MB c/u • Se verán aquí antes de guardar
        </div>
      </motion.div>

      {/* Rechazos */}
      <AnimatePresence initial={false}>
        {rejected.length > 0 && (
          <motion.div
            layout
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
            className="p-3 mt-3 border rounded-md border-rose-200 bg-rose-50"
          >
            <div className="text-sm font-semibold text-rose-800">Algunos archivos no se pudieron agregar</div>
            <ul className="mt-2 space-y-1 text-xs text-rose-700">
              {rejected.map((r) => (
                <li key={`${r.file.name}-${r.file.size}`} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {r.file.name} ({formatBytes(r.file.size)})
                  </span>
                  <span className="shrink-0">{rejectionToText(r)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de archivos */}
      <div className="mt-3">
        <AnimatePresence initial={false}>
          {value.length > 0 ? (
            <motion.div
              layout
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
              className="overflow-x-auto rounded-md border border-[var(--subtle)] bg-white"
            >
              <table className="min-w-full text-sm">
                <thead className="border-b border-[var(--subtle)] text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Archivo</th>
                    <th className="px-3 py-2 text-left">Tamaño</th>
                    <th className="w-32 px-3 py-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <motion.tbody layout>
                  <AnimatePresence initial={false}>
                    {value.map((f) => (
                      <motion.tr
                        key={`${f.name}-${f.size}`}
                        layout
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.14 }}
                        className="border-b border-[var(--subtle)]/70 last:border-b-0"
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-md border border-[var(--subtle)] bg-slate-50">
                              <FileText size={16} className="text-slate-700" />
                            </span>
                            <div className="min-w-0">
                              <div className="font-medium truncate text-slate-800">{f.name}</div>
                              <div className="text-xs text-slate-500">PDF</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-700">{formatBytes(f.size)}</td>
                        <td className="px-3 py-2">
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onChange(value.filter((x) => !(x.name === f.name && x.size === f.size)))}
                            className="inline-flex items-center gap-2 rounded-md border border-[var(--subtle)] px-3 py-1.5 hover:bg-white"
                            type="button"
                            disabled={disabled}
                          >
                            <Trash2 size={14} /> Quitar
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
              </table>

              <div className="flex items-center justify-between gap-2 border-t border-[var(--subtle)] px-3 py-2">
                <div className="text-xs text-slate-500">
                  {value.length} archivo(s) listo(s) • Se enviarán cuando presiones Guardar/Actualizar
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onChange([])}
                  className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100"
                  type="button"
                  disabled={disabled}
                >
                  <Trash2 size={14} /> Quitar todos
                </motion.button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}