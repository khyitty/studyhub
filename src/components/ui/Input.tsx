import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

const base = 'w-full rounded-card border border-line-strong bg-surface px-3 text-base text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none'

type FieldProps = { label?: string; hint?: string; error?: string }

function Field({ label, hint, error, children }: FieldProps & { children: ReactNode }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : hint ? <span className="mt-1 block text-xs text-ink-muted">{hint}</span> : null}
    </label>
  )
}

export function Input({ label, hint, error, className = '', ...rest }: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  return <Field label={label} hint={hint} error={error}><input className={`${base} min-h-11 ${className}`} {...rest} /></Field>
}

export function Select({ label, hint, error, className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  return <Field label={label} hint={hint} error={error}><select className={`${base} min-h-11 ${className}`} {...rest}>{children}</select></Field>
}

export function Textarea({ label, hint, error, className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  return <Field label={label} hint={hint} error={error}><textarea className={`${base} py-2 ${className}`} {...rest} /></Field>
}
