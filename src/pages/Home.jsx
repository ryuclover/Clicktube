import React, { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import api from '../api/api'
import { CATEGORIES } from '../utils/categories'
import VideoCard from '../components/VideoCard'
import SkeletonCard from '../components/SkeletonCard'
import './Home.css'


const Home = () => {
  const [activeCategory, setActiveCategory] = useState('All')
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const fetchVideos = useCallback(async (pageNum, isNewCategory = false) => {
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)
    if (pageNum === 1) setLoadError(null)

    try {
      const res = await api.get('/videos', {
        params: { category: activeCategory, sort, page: pageNum, limit: 12 }
      })
      const newVideos = res.data.videos || []
      setVideos(prev => isNewCategory ? newVideos : [...prev, ...newVideos])
      setHasMore(res.data.page < res.data.totalPages)
    } catch (err) {
      const code = err.response?.data?.code
      const status = err.response?.status
      if (code === 'DB_UNAVAILABLE' || status === 503) {
        setLoadError('db')
      } else if (!err.response) {
        setLoadError('network')
      } else {
        setLoadError('generic')
      }
      if (pageNum === 1) toast.error('Failed to load videos')
      console.error('Failed to fetch videos', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [activeCategory, sort])

  useEffect(() => {
    setPage(1)
    fetchVideos(1, true)
  }, [activeCategory, sort, fetchVideos])

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchVideos(nextPage)
    }
  }

  return (
    <div className="home-page">
      <Helmet>
        <title>Clicktube - Share your moments</title>
        <meta name="description" content="Discover and share amazing videos on Clicktube. The modern video platform for everyone." />
      </Helmet>
      <div className="home-controls">
        <div className="categories-bar">
          {CATEGORIES.map((category) => (
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
        ) : loadError && videos.length === 0 ? (
          <div className="empty-message" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
              {loadError === 'db'
                ? 'Database is temporarily unavailable.'
                : loadError === 'network'
                  ? 'Could not reach the server. Check your connection.'
                  : 'Failed to load videos.'}
            </p>
            <p style={{ opacity: 0.7, marginBottom: '16px' }}>
              {loadError === 'db'
                ? 'The backend is online but MongoDB is disconnected. Try again in a moment.'
                : 'Please try again.'}
            </p>
            <button className="load-more-btn" onClick={() => fetchVideos(1, true)}>
              Try again
            </button>
          </div>
        ) : (
          videos.map((video, index) => (
            <VideoCard key={`${video.id}-${index}`} video={video} />
          ))
        )}
        {loadingMore && Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
      </div>

      {hasMore && !loading && (
        <div className="load-more-container">
          <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Show More'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Home
