import React, { useState, useEffect, useContext } from 'react'
import api from '../api/api'
import { AuthContext } from '../context/AuthContext'
import VideoCard from '../components/VideoCard'
import SkeletonCard from '../components/SkeletonCard'
import { ThumbsUp } from 'lucide-react'
import './History.css'

const Liked = () => {
  const { user } = useContext(AuthContext)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    const fetchLiked = async () => {
      try {
        const res = await api.get(`/social/liked/${user.id}`)
        setVideos(res.data || [])
      } catch (err) {
        console.error('Failed to fetch liked videos', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLiked()
  }, [user])

  if (!user) return <div className="auth-message">Please login to view your liked videos.</div>

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
        <div className="history-grid">
          {videos.map((video, index) => (
            <div key={`${video.id}-liked-${index}`} className="history-item">
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-message">You haven&apos;t liked any videos yet.</p>
      )}
    </div>
  )
}

export default Liked
