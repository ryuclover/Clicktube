import React, { useState, useEffect } from 'react'
import api from '../api/api'
import config from '../config'
import VideoCard from '../components/VideoCard'
import SkeletonCard from '../components/SkeletonCard'
import { Flame } from 'lucide-react'
import './Trending.css'

const Trending = () => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await api.get('/videos', {
          params: { sort: 'views' } // Sort by views for trending
        })
        setVideos(res.data.videos || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrending()
  }, [])

  return (
    <div className="trending-page fade-in">
      <div className="trending-header">
        <Flame size={32} color="#ff4500" fill="#ff4500" />
        <h1>Trending</h1>
      </div>
      
      <div className="video-grid">
        {loading ? (
          Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          videos.map((video, index) => (
            <VideoCard key={`${video.id}-trending-${index}`} video={video} />
          ))
        )}
      </div>
    </div>
  )
}

export default Trending
