import { AuthProvider, useAuth } from './contexts/AuthContext'
import Auth from './components/Auth'
import RoomList from './components/RoomList'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return user ? <RoomList /> : <Auth />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
