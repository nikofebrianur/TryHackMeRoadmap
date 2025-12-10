import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type Category = {
  id: string
  name: string
  display_order: number
  total_rooms: number
}

type Room = {
  id: string
  title: string
  url: string
  category_id: string
  display_order: number
}

type Progress = {
  room_id: string
  completed: boolean
}

export default function RoomList() {
  const { user, signOut } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [progress, setProgress] = useState<Map<string, boolean>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('display_order')

    const { data: roomsData } = await supabase
      .from('rooms')
      .select('*')
      .order('display_order')

    if (user) {
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('room_id, completed')
        .eq('user_id', user.id)

      const progressMap = new Map<string, boolean>()
      progressData?.forEach((p: Progress) => {
        progressMap.set(p.room_id, p.completed)
      })
      setProgress(progressMap)
    }

    setCategories(categoriesData || [])
    setRooms(roomsData || [])
    setLoading(false)
  }

  const toggleRoom = async (roomId: string) => {
    if (!user) return

    const isCompleted = progress.get(roomId) || false
    const newValue = !isCompleted

    const progressMap = new Map(progress)
    progressMap.set(roomId, newValue)
    setProgress(progressMap)

    const { data: existing } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('room_id', roomId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('user_progress')
        .update({
          completed: newValue,
          completed_at: newValue ? new Date().toISOString() : null,
        })
        .eq('user_id', user.id)
        .eq('room_id', roomId)
    } else {
      await supabase.from('user_progress').insert({
        user_id: user.id,
        room_id: roomId,
        completed: newValue,
        completed_at: newValue ? new Date().toISOString() : null,
      })
    }
  }

  const getRoomsForCategory = (categoryId: string) => {
    return rooms.filter((room) => room.category_id === categoryId)
  }

  const getCompletedCount = (categoryId: string) => {
    const categoryRooms = getRoomsForCategory(categoryId)
    return categoryRooms.filter((room) => progress.get(room.id)).length
  }

  const getTotalProgress = () => {
    const completed = Array.from(progress.values()).filter(Boolean).length
    return { completed, total: rooms.length }
  }

  if (loading) {
    return <div className="loading">Loading rooms...</div>
  }

  const totalProgress = getTotalProgress()

  return (
    <div className="room-list-container">
      <header className="header">
        <div className="header-content">
          <h1>TryHackMe Progress Tracker</h1>
          <div className="header-actions">
            <div className="progress-summary">
              <span className="progress-text">
                {totalProgress.completed} / {totalProgress.total} rooms completed
              </span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(totalProgress.completed / totalProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
            <button onClick={signOut} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {categories.length === 0 ? (
          <div className="empty-state">
            <h2>No rooms available yet</h2>
            <p>Rooms data needs to be seeded into the database.</p>
          </div>
        ) : (
          categories.map((category) => {
            const categoryRooms = getRoomsForCategory(category.id)
            const completedCount = getCompletedCount(category.id)

            return (
              <div key={category.id} className="category-section">
                <div className="category-header">
                  <h2>{category.name}</h2>
                  <span className="category-progress">
                    {completedCount} / {categoryRooms.length}
                  </span>
                </div>

                <div className="rooms-grid">
                  {categoryRooms.map((room) => (
                    <div key={room.id} className="room-card">
                      <label className="room-label">
                        <input
                          type="checkbox"
                          checked={progress.get(room.id) || false}
                          onChange={() => toggleRoom(room.id)}
                          className="room-checkbox"
                        />
                        <span className="room-title">{room.title}</span>
                      </label>
                      <a
                        href={room.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="room-link"
                      >
                        Visit Room
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </main>
    </div>
  )
}
