import { AlertTriangle } from 'lucide-react'

type Props = {
  title:   string
  body:    string
  action?: string
}

export function AlertCallout({ title, body, action }: Props) {
  return (
    <div className="rounded-[10px] border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-amber-900">{title}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-amber-800">{body}</p>
          {action && (
            <p className="mt-2 text-[11px] font-medium text-amber-700 border-t border-amber-200 pt-2">
              {action}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AlertCallout
