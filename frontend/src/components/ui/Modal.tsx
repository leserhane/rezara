import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({
  open, onClose, title, children, wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`card max-h-[92vh] w-full overflow-y-auto rounded-b-none sm:rounded-b-xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-sand-200 bg-white px-5 py-4 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
