import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

const variants = {
  primary: 'bg-primary text-on-primary hover:brightness-95 active:scale-[0.98]',
  secondary: 'bg-surface-2 text-ink hover:brightness-95 active:scale-[0.98]',
  ghost: 'bg-transparent text-ink-muted hover:bg-surface-2',
  danger: 'bg-danger text-white hover:brightness-95',
}
const sizes = { sm: 'min-h-9 px-3 text-sm', md: 'min-h-11 px-4 text-base' }

export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-pill font-semibold transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    />
  )
}
