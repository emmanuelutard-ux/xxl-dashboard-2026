import { type ReactNode } from 'react'

export type TagVariant = 'default' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'terra'

const variantClasses: Record<TagVariant, string> = {
  default: 'bg-white border-sand-200 text-sand-700',
  indigo:  'bg-indigo-50 border-indigo-100 text-indigo-700',
  emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  amber:   'bg-amber-50 border-amber-100 text-amber-700',
  rose:    'bg-rose-50 border-rose-100 text-rose-700',
  terra:   'bg-terra-50 border-terra-100 text-terra-700',
}

type Props = {
  variant?: TagVariant
  children: ReactNode
  className?: string
}

export function Tag({ variant = 'default', children, className = '' }: Props) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5',
        'text-xs font-medium',
        'px-2.5 py-0.5',
        'rounded-ds-full border',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

export default Tag
