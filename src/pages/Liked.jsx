import React, { useState, useEffect, useContext } from 'react'
import api from '../api/api'
import { AuthContext } from '../context/AuthContext'
import VideoCard from '../components/VideoCard'
import SkeletonCard from '../components/SkeletonCard'
import { Link } from 'react-router-dom'
import { ThumbsUp } from 'lucide-react'
import './History.css'

const Liked = () => {
  const { user } = useContext(AuthContext)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    const fetchLiked = async () => {
      try {
        const res = await api.get(`/social/liked/${user.id}`, { params: { page, limit: 20 } })
        const data = res.data.videos || res.data
        setVideos(prev => page === 1 ? data : [...prev, ...data])
        setHasMore(data.length === 20)
        setTotal(res.data.total || data.length)
      } catch (err) {
        console.error('Failed to fetch liked videos', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLiked()
  }, [user, page])

  const loadMore = () => {
    if (!loading && hasMore) setPage(p => p + 1)
  }

  if (!user) {
    return (
      <div className="history-page fade-in">
        <div className="auth-message">
          <ThumbsUp size={48} color="var(--text-secondary)" />
          <h2>Keep track of your favorite videos</h2>
          <p>Sign in to view the videos you've liked.</p>
          <Link to="/login" className="login-link-btn library-login">Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="history-page fade-in">
      <div className="history-header">
        <ThumbsUp size={28} />
        <h1>Liked Videos</h1>
      </div>

      {loading ? (
        <div className="history-grid">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : videos.length > 0 ? (
        <>
          <div className="history-grid">
            {videos.map((video, index) => (
              <div key={`${video.id}-liked-${index}`} className="history-item">
                <VideoCard video={video} />
              </div>
            ))}
          </div>
          {hasMore && (
            <button className="load-more-btn" onClick={() => setPage(p => p + 1)}>
              Load more
            </button>
          )}
        </>
      ) : (
        <p className="empty-message">You haven&apos;t liked any videos yet.</p>
      )}
    </div>
  )
}

export default Liked
