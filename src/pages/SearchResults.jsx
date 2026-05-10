import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import config from '../config'
import VideoCard from '../components/VideoCard'
import ChannelResultCard from '../components/ChannelResultCard'
import SkeletonCard from '../components/SkeletonCard'
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
          const res = await axios.get(`${config.apiUrl}/videos`, {
            params: { search: searchTerm }
          })
          setResults(res.data)
        } else if (activeTab === 'channels') {
          const res = await axios.get(`${config.apiUrl}/auth/search`, {
            params: { q: searchTerm }
          })
          setResults(res.data)
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
          Array(5).fill(0).map((_, i) => <div key={i} className="skeleton-search-item"><SkeletonCard /></div>)
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
