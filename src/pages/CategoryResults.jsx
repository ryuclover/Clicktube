import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/api'
import VideoCard from '../components/VideoCard'
import SkeletonCard from '../components/SkeletonCard'
import { Music2, Gamepad2, Trophy, Rocket } from 'lucide-react'
import './Trending.css' // Reusing trending layout

const CategoryResults = () => {
  const { categoryName } = useParams()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  const getIcon = () => {
    switch (categoryName.toLowerCase()) {
      case 'music': return <Music2 size={32} color="var(--accent-color)" />
      case 'gaming': return <Gamepad2 size={32} color="#10b981" />
      case 'sports': return <Trophy size={32} color="#f59e0b" />
      default: return <Rocket size={32} color="var(--text-primary)" />
    }
  }

  useEffect(() => {
    const fetchByCategory = async () => {
      setLoading(true)
      try {
        const res = await api.get('/videos', {
          params: { category: categoryName }
        })
        setVideos(res.data.videos || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchByCategory()
  }, [categoryName])

  return (
    <div className="trending-page fade-in">
      <div className="trending-header">
        {getIcon()}
        <h1>{categoryName}</h1>
      </div>
      
      <div className="video-grid">
        {loading ? (
          Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : videos.length > 0 ? (
          videos.map((video, index) => (
            <VideoCard key={`${video.id}-cat-${index}`} video={video} />
          ))
        ) : (
          <div className="no-results">
            <p>No videos found in the {categoryName} category yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryResults
