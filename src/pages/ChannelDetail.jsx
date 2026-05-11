import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/api'
import { CheckCircle, Users, Video } from 'lucide-react'
import VideoCard from '../components/VideoCard'
import Skeleton from '../components/Skeleton'
import './ChannelDetail.css'

const ChannelDetail = () => {
  const { id } = useParams()
  const [channel, setChannel] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChannelData = async () => {
      setLoading(true)
      try {
        // Fetch Profile
        const profileRes = await api.get(`/social/profile/${id}`)
        setChannel(profileRes.data)

        // Fetch Videos
        const videosRes = await api.get('/videos', {
          params: { userId: id }
        })
        setVideos(videosRes.data.videos || [])
      } catch (err) {
        console.error('Error fetching channel data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchChannelData()
  }, [id])

  if (loading) {
    return (
      <div className="channel-detail-page fade-in">
        <Skeleton type="thumbnail" classes="banner-skeleton" />
        <div className="channel-header" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Skeleton type="circle" classes="avatar-skeleton" />
            <div style={{ flex: 1 }}>
              <Skeleton type="title" />
              <Skeleton type="text" classes="w-1/4" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!channel) return <div className="error-state">Channel not found</div>

  return (
    <div className="channel-detail-page fade-in">
      <div className="channel-banner">
        <img src={channel.banner || "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=2000"} alt="banner" />
      </div>
      
      <div className="channel-header">
        <div className="channel-header-content">
          <div className="channel-avatar-large">
            <img src={channel.avatar} alt={channel.username} />
          </div>
          <div className="channel-info-main">
            <h1 className="channel-name-large">
              {channel.username} <CheckCircle size={24} fill="#a1a1aa" color="var(--bg-color)" />
            </h1>
            <div className="channel-stats">
              <span>@{channel.username.toLowerCase().replace(/\s/g, '')}</span>
              <span>{channel.subscribers || 0} subscribers</span>
              <span>{videos.length} videos</span>
            </div>
            <p className="channel-bio">
              {channel.bio || 'Welcome to my channel! Subscribe for more content.'}
            </p>
            <div className="channel-actions">
              <button className="subscribe-btn">Subscribe</button>
              <button className="join-btn">Join</button>
            </div>
          </div>
        </div>
        
        <div className="channel-tabs">
          <button className="tab active">Home</button>
          <button className="tab">Videos</button>
          <button className="tab">Playlists</button>
          <button className="tab">Community</button>
          <button className="tab">About</button>
        </div>
      </div>
      
      <div className="channel-videos">
        <h3>Videos</h3>
        <div className="video-grid">
          {videos.length > 0 ? (
            videos.map((v, index) => (
              <VideoCard key={`${v.id}-channel-${index}`} video={v} />
            ))
          ) : (
            <p className="empty-message">This channel has no videos yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChannelDetail
