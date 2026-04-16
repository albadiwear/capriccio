export default function Toast({ message, isVisible, type = 'success' }) {
  const toneClass =
    type === 'error'
      ? 'bg-red-600 text-white'
      : 'bg-[#1a1a18] text-white'

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-300 ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-5 pointer-events-none'
      }`}
    >
      <div className={`rounded-lg px-5 py-3 text-sm shadow-lg ${toneClass}`}>
        {message}
      </div>
    </div>
  )
}
