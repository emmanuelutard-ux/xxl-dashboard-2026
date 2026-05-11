import { type ButtonHTMLAttributes, type ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'ghost' | 'default'
export type ButtonSize    = 'sm' | 'md'

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-indigo-600 text-white border-indigo-600',
    'hover:bg-indigo-700 hover:border-indigo-700',
  ].join(' '),
  default: [
    'bg-white text-sand-700 border-sand-200',
    'hover:bg-sand-100',
  ].join(' '),
  ghost: [
    'bg-transparent text-sand-700 border-transparent',
    'hover:bg-sand-100',
  ].join(' '),
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function Button({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      className={[
        'inline-flex items-center gap-2',
        'font-medium rounded-ds-md border',
        'transition-all duration-100',
        'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button
