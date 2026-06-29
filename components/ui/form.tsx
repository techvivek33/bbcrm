"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

const baseInput =
  "focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50";

export function FormField({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  name,
  hint,
  required,
  type = "text",
  defaultValue,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  type?: string;
  defaultValue?: string | number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <FormField label={label} hint={hint} required={required} className={className}>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={baseInput}
      />
    </FormField>
  );
}

export function TextareaField({
  label,
  name,
  hint,
  required,
  rows = 3,
  defaultValue,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  rows?: number;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <FormField label={label} hint={hint} required={required} className={className}>
      <textarea
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={cn(baseInput, "resize-none")}
      />
    </FormField>
  );
}

export function SelectField({
  label,
  name,
  options,
  hint,
  required,
  defaultValue,
  className,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  hint?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <FormField label={label} hint={hint} required={required} className={className}>
      <select name={name} required={required} defaultValue={defaultValue} className={baseInput}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FormField>
  );
}

export function SubmitButton({ children = "Save", className }: { children?: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60",
        className,
      )}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
