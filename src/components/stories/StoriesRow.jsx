import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import StoriesViewer from './StoriesViewer'

export default function StoriesRow() {
  const [stories, setStories] = useState([])
  const [activeIndex, setActiveIndex] = useState(null)

  useEffect(() => {
    supabase
      .from('stories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => setStories(data || []))
  }, [])

  if (!stories.length) return null

  return (
    <>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 py-3 md:px-8">
        {stories.map((story, i) => (
          <button
            key={story.id}
            onClick={() => setActiveIndex(i)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#D4537E] to-[#f5a623]">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                <img
                  src={story.image_url}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {story.title && (
              <span className="text-[10px] text-gray-600 truncate w-16 text-center">
                {story.title}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <StoriesViewer
          stories={stories}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  )
}
