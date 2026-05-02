import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function StoriesViewer({ stories, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const navigate = useNavigate()
  const story = stories[index]

  useEffect(() => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          if (index < stories.length - 1) {
            setIndex((i) => i + 1)
          } else {
            onClose()
          }
          return 0
        }
        return p + 2
      })
    }, 100)
    return () => clearInterval(interval)
  }, [index])

  if (!story) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="relative w-full max-w-sm h-full md:h-[85vh] md:rounded-2xl overflow-hidden">

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/30"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Image */}
        <img
          src={story.image_url}
          alt={story.title}
          className="w-full h-full object-cover"
        />

        {/* Bottom info */}
        {(story.title || story.link_url) && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            {story.title && (
              <p className="text-white font-medium mb-2">{story.title}</p>
            )}
            {story.link_url && (
              <button
                onClick={() => {
                  onClose()
                  navigate(story.link_url)
                }}
                className="w-full h-10 rounded-xl bg-white text-[#1a1a18] text-sm font-medium"
              >
                {story.link_label || 'Смотреть →'}
              </button>
            )}
          </div>
        )}

        {/* Navigation zones */}
        <button
          onClick={() => index > 0 && setIndex((i) => i - 1)}
          className="absolute left-0 top-0 bottom-0 w-1/3"
        />
        <button
          onClick={() => (index < stories.length - 1 ? setIndex((i) => i + 1) : onClose())}
          className="absolute right-0 top-0 bottom-0 w-1/3"
        />
      </div>
    </div>
  )
}
