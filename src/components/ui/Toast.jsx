export default function Toast({ message, isVisible, type = 'success', onClick, actionText }) {
  const toneClass =
    type === 'error'
      ? 'bg-red-600 text-white'
      : 'bg-[#1a1a18] text-white'

  const clickable = typeof onClick === 'function'
  const action = actionText ?? 'Перейти →'

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-300 ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-5 pointer-events-none'
      }`}
    >
      <div
        className={`rounded-lg px-5 py-3 text-sm shadow-lg ${toneClass} ${
          clickable ? 'cursor-pointer select-none' : ''
        }`}
        onClick={clickable ? onClick : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={(e) => {
          if (!clickable) return
          if (e.key === 'Enter' || e.key === ' ') onClick?.()
        }}
      >
        <span>{message}</span>
        {clickable && (
          <span className="ml-3 text-white/80 font-medium">{action}</span>
        )}
      </div>
    </div>
  )
}
