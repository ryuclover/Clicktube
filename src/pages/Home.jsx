import React, { useState, useEffect } from 'react'
import axios from 'axios'
import config from '../config'
import VideoCard from '../components/VideoCard'
import SkeletonCard from '../components/SkeletonCard'
import { mockVideos } from '../utils/mockData'
import './Home.css'

const categories = ['All', 'React', 'Design', 'Music', 'Gaming', 'AI', 'Coding', 'Nature', 'Tutorials', 'Vlogs']

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('All')
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true)
      if (config.mode === 'mock') {
        setTimeout(() => {
          setVideos(mockVideos)
          setLoading(false)
        }, 800) // Simulate delay for skeleton demo
        return
      }

      try {
        const res = await axios.get(`${config.apiUrl}/videos`, {
          params: { category: activeCategory, sort }
        })
        setVideos(res.data)
      } catch (err) {
        console.error('Failed to fetch videos', err)
        if (config.useMockFallback) setVideos(mockVideos)
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [activeCategory, sort])

  return (
    <div className="home-page">
      <div className="home-controls">
        <div className="categories-bar">
          {categories.map((category) => (
            <button 
              key={category}
              className={`category-pill ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="sort-control">
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>
      </div>
      
      <div className="video-grid">
        {loading ? (
          Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          videos.map((video, index) => (
            <VideoCard key={`${video.id}-${index}`} video={video} />
          ))
        )}
      </div>
    </div>
  )
}

export default Home
