import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/api'
import config from '../config'
import VideoCard from '../components/VideoCard'
import ChannelResultCard from '../components/ChannelResultCard'
import Skeleton from '../components/Skeleton'
import { SlidersHorizontal } from 'lucide-react'
import './SearchResults.css'

const SearchResults = () => {
  const { searchTerm } = useParams()
  const [activeTab, setActiveTab] = useState('videos')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      try {
        if (activeTab === 'videos') {
          const res = await api.get('/videos', {
            params: { search: searchTerm }
          })
          setResults(res.data.videos || [])
        } else if (activeTab === 'channels') {
          const res = await api.get('/auth/search', {
            params: { q: searchTerm }
          })
          setResults(res.data || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [searchTerm, activeTab])

  return (
    <div className="search-results-page fade-in">
      <div className="search-header">
        <div className="search-meta">
          <h2>Results for <span className="term">"{searchTerm}"</span></h2>
          <button className="filter-toggle-btn">
            <SlidersHorizontal size={18} /> Filters
          </button>
        </div>
        
        <div className="search-tabs">
          <button 
            className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            Videos
          </button>
          <button 
            className={`tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
            onClick={() => setActiveTab('channels')}
          >
            Channels
          </button>
        </div>
      </div>
      
      <div className="search-results-list">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="search-item-row" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <Skeleton type="thumbnail" classes="w-1/3" />
              <div style={{ flex: 1 }}>
                <Skeleton type="title" />
                <Skeleton type="text" classes="w-1/2" />
                <Skeleton type="text" classes="w-1/4" />
              </div>
            </div>
          ))
        ) : (
          results.length > 0 ? (
            results.map((item, index) => (
              <div key={`${item.id}-${index}`} className="search-item-row">
                {activeTab === 'videos' ? (
                  <VideoCard video={item} layout="horizontal" />
                ) : (
                  <ChannelResultCard channel={item} />
                )}
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No results found for "{searchTerm}"</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default SearchResults
