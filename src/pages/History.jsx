import React, { useState, useEffect, useContext } from 'react'
import api from '../api/api'
import config from '../config'
import { AuthContext } from '../context/AuthContext'
import VideoCard from '../components/VideoCard'
import SkeletonCard from '../components/SkeletonCard'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import './History.css'

const History = () => {
  const { user } = useContext(AuthContext)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        try {
          const res = await api.get(`/social/history/${user.id}`, { params: { page, limit: 20 } })
          const data = res.data.videos || res.data
          setHistory(prev => page === 1 ? data : [...prev, ...data])
          setHasMore(data.length === 20)
          setTotal(res.data.total || data.length)
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
      fetchHistory()
    }
  }, [user, page])

  const loadMore = () => {
    if (!loading && hasMore) setPage(p => p + 1)
  }

  if (!user) {
    return (
      <div className="history-page fade-in">
        <div className="auth-message">
          <Clock size={48} color="var(--text-secondary)" />
          <h2>Keep track of what you watch</h2>
          <p>Watch history isn't viewable when signed out.</p>
          <Link to="/login" className="login-link-btn library-login">Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="history-page fade-in">
      <div className="history-header">
        <Clock size={28} />
        <h1>Watch History</h1>
      </div>
      
      {loading ? (
        <div className="history-grid">
          {Array(8).fill(0).map((_, i) => <div key={i} className="history-item"><SkeletonCard /></div>)}
        </div>
      ) : history.length > 0 ? (
        <>
          <div className="history-grid">
            {history.map((video, index) => (
              <div key={`${video.id}-${index}`} className="history-item">
                <VideoCard video={video} />
              </div>
            ))}
          </div>
          {hasMore && (
            <button className="load-more-btn" onClick={loadMore}>
              Load more
            </button>
          )}
        </>
      ) : (
        <p className="empty-message">You haven't watched any videos yet.</p>
      )}
    </div>
  )
}

export default History
