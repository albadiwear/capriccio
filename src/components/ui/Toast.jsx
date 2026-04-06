export default function Toast({ message, isVisible, type = 'success' }) {
  const toneClass =
    type === 'error'
      ? 'bg-red-600 text-white'
      : 'bg-gray-900 text-white'

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div className={`rounded-xl px-5 py-3 text-sm shadow-lg ${toneClass}`}>
        {message}
      </div>
    </div>
  )
}
