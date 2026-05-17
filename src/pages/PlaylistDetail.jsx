import React, { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Play, Trash2, ListVideo, Film, User, ChevronRight } from 'lucide-react'
import api from '../api/api'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './PlaylistDetail.css'

const PlaylistDetail = () => {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchPlaylistDetails = async () => {
    try {
      const res = await api.get(`/social/playlists/detail/${id}`)
      setPlaylist(res.data)
    } catch (err) {
      toast.error('Failed to load playlist details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlaylistDetails()
  }, [id])

  const handleRemoveVideo = async (videoId) => {
    try {
      const res = await api.post(`/social/playlists/${id}/video`, { videoId })
      toast.success('Video removed from playlist')
      
      // Update local state by filtering out the removed video
      setPlaylist(prev => ({
        ...prev,
        videoIds: prev.videoIds.filter(vid => vid !== videoId),
        videos: prev.videos.filter(v => v.id !== videoId)
      }))
    } catch (err) {
      toast.error('Failed to remove video')
    }
  }

  const handlePlayAll = () => {
    if (playlist && playlist.videos.length > 0) {
      navigate(`/video/${playlist.videos[0].id}`)
    } else {
      toast.error('No videos in this playlist to play')
    }
  }

  if (loading) {
    return <div className="loading-state">Loading playlist...</div>
  }

  if (!playlist) {
    return (
      <div className="error-state">
        <ListVideo size={48} />
        <h2>Playlist not found</h2>
        <Link to="/library" className="back-link">Back to Library</Link>
      </div>
    )
  }

  return (
    <div className="playlist-detail-page fade-in">
      <div className="playlist-sidebar glass">
        <div className="playlist-cover-preview">
          {playlist.videos.length > 0 ? (
            <>
              <img src={playlist.videos[0].thumbnail} alt="cover" className="playlist-cover-image" />
              <div className="playlist-cover-badge">
                <Film size={16} />
                <span>PLAYLIST</span>
              </div>
            </>
          ) : (
            <>
              <ListVideo size={48} />
              <span>Empty Playlist</span>
            </>
          )}
        </div>
        
        <div className="playlist-meta-info">
          <h1>{playlist.name}</h1>
          <div className="playlist-owner">
            <span>Created by you</span>
          </div>
          <div className="playlist-stats">
            <span>{playlist.videos.length} videos</span>
            <span>Updated recently</span>
          </div>
        </div>

        <div className="playlist-actions-btns">
          <button className="playlist-play-btn" onClick={handlePlayAll}>
            <Play size={18} fill="currentColor" /> Play All
          </button>
        </div>
      </div>

      <div className="playlist-videos-list">
        {playlist.videos.length > 0 ? (
          playlist.videos.map((video, index) => (
            <div key={video.id} className="playlist-video-row glass">
              <span className="video-index-num">{index + 1}</span>
              
              <Link to={`/video/${video.id}`} className="playlist-video-link">
                <img src={video.thumbnail} alt={video.title} className="playlist-video-thumb" />
                <div className="playlist-video-details">
                  <h3>{video.title}</h3>
                  <span className="playlist-video-channel">{video.channel}</span>
                </div>
              </Link>
              
              <button 
                className="remove-from-playlist-btn" 
                onClick={() => handleRemoveVideo(video.id)}
                title="Remove from playlist"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        ) : (
          <div className="empty-message" style={{ marginTop: '50px' }}>
            <Film size={36} color="var(--text-secondary)" style={{ marginBottom: '12px' }} />
            <p>No videos in this playlist yet.</p>
            <Link to="/" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', marginTop: '8px' }}>
              Discover videos <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlaylistDetail
