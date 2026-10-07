"use client";

import { AnimatePresence, m } from "framer-motion";
import Image from "next/image";
import { ImagePlus, RefreshCw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { IMAGE_TYPES } from "@/lib/constants";
import { cn, validateImage } from "@/lib/utils";

interface ImageUploadProps {
  name: string;
  label: string;
  currentUrl?: string;
  required?: boolean;
  hint?: string;
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageUpload({
  name,
  label,
  currentUrl,
  required = false,
  hint,
}: ImageUploadProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{
    url: string;
    name: string;
    size: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  function select(files: FileList | null) {
    const file = files?.[0];
    if (!file || !inputRef.current) return;

    const problem = validateImage(file);
    if (problem) {
      setError(problem);
      setPreview(null);
      inputRef.current.value = "";
      return;
    }

    if (inputRef.current.files !== files) inputRef.current.files = files;
    setError(null);
    setPreview({
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    });
  }

  const shownUrl = preview?.url ?? currentUrl;

  return (
    <div>
      <p id={`${id}-label`} className="mb-2 text-sm font-medium text-ink-soft">
        {label}
      </p>

      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          select(event.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-field p-5 text-center transition-colors has-focus-visible:ring-2 has-focus-visible:ring-brand/40",
          dragging
            ? "border-brand bg-brand/5"
            : error
              ? "border-danger/60"
              : "border-line-strong hover:border-brand hover:bg-brand/5",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {shownUrl ? (
            <m.div
              key={shownUrl}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative h-28 w-40 overflow-hidden rounded-xl border border-line-strong bg-surface">
                <Image
                  src={shownUrl}
                  alt=""
                  fill
                  sizes="160px"
                  unoptimized={Boolean(preview)}
                  className="object-contain p-2"
                />
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
                <RefreshCw className="size-3.5" />
                {preview
                  ? `${preview.name} · ${formatSize(preview.size)}`
                  : "Replace image"}
              </span>
            </m.div>
          ) : (
            <m.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <ImagePlus className="mb-2 size-8 text-brand" />
              <span className="text-sm font-medium text-ink-soft">
                Click to upload or drag an image here
              </span>
              <span className="mt-1 text-xs text-subtle">
                {hint ?? "JPEG, PNG, WebP, GIF or AVIF · up to 5 MB"}
              </span>
            </m.div>
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          required={required && !currentUrl}
          aria-labelledby={`${id}-label`}
          aria-invalid={Boolean(error) || undefined}
          onChange={(event) => select(event.target.files)}
          className="sr-only"
        />
      </label>

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
