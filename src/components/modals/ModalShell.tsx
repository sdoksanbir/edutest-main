import type { ReactNode } from 'react'

interface ModalShellProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** @deprecated Tema artık data-edutest-theme ile otomatik */
  dark?: boolean
  wide?: boolean
  elevated?: boolean
}

export default function ModalShell({
  title,
  onClose,
  children,
  wide = false,
  elevated = false,
}: ModalShellProps) {
  return (
    <div
      className={`tq-popup-overlay ${elevated ? "z-[70]" : "z-50"}`}
      onClick={onClose}
    >
      <div
        className={`tq-popup-panel max-h-[90vh] w-full overflow-y-auto rounded-xl p-5 ${
          wide ? 'max-w-4xl' : 'max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="tq-popup-title text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="tq-popup-close"
          >
            Kapat
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
