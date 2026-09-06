import React, { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/api'
import { CheckCircle, Users, Video } from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import { getAvatarUrl } from '../utils/display'
import VideoCard from '../components/VideoCard'
import Skeleton from '../components/Skeleton'
import './ChannelDetail.css'

const ChannelDetail = () => {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const [channel, setChannel] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscribed, setSubscribed] = useState(false)

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

        // Check subscription status
        if (user && user.id !== id) {
          try {
            const subsRes = await api.get(`/social/subscriptions/${user.id}`)
            setSubscribed((subsRes.data || []).some((sub) => sub.id === id))
          } catch {
            setSubscribed(false)
          }
        } else {
          setSubscribed(false)
        }
      } catch (err) {
        console.error('Error fetching channel data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchChannelData()
  }, [id, user?.id])

  const handleSubscribe = async () => {
    if (!user) return toast.error('Please login to subscribe')
    if (user.id === channel.id) return toast.error('You cannot subscribe to your own channel')
    try {
      const res = await api.post('/social/subscribe', { channelId: channel.id })
      setSubscribed(res.data.subscribed)
      setChannel((prev) => prev ? {
        ...prev,
        subscribers: Math.max(0, (prev.subscribers || 0) + (res.data.subscribed ? 1 : -1))
      } : prev)
      toast.success(res.data.subscribed ? 'Subscribed!' : 'Unsubscribed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    }
  }

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
            <img src={getAvatarUrl(channel.avatar)} alt={channel.username} onError={(e) => { e.target.src = '/assets/default-avatar.svg' }} />
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
              <button
                className={`subscribe-btn ${subscribed ? 'subscribed' : ''}`}
                disabled={user?.id === channel.id}
                onClick={handleSubscribe}
              >
                {user?.id === channel.id ? 'Your channel' : (subscribed ? 'Subscribed' : 'Subscribe')}
              </button>
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
