import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import config from '../config'
import { AuthContext } from '../context/AuthContext'
import VideoCard from '../components/VideoCard'
import SkeletonCard from '../components/SkeletonCard'
import { Link } from 'react-router-dom'
import { PlaySquare, Clock, ThumbsUp, ListVideo } from 'lucide-react'
import './Library.css'

const Library = () => {
  const { user } = useContext(AuthContext)
  const [history, setHistory] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const fetchLibraryData = async () => {
        try {
          const [historyRes, playlistsRes] = await Promise.all([
            axios.get(`${config.apiUrl}/social/history/${user.id}`),
            axios.get(`${config.apiUrl}/social/playlists/${user.id}`)
          ])
          setHistory(historyRes.data.slice(0, 8)) // Only show recent 8
          setPlaylists(playlistsRes.data)
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
      fetchLibraryData()
    } else {
      setLoading(false)
    }
  }, [user])

  if (!user) {
    return (
      <div className="library-page fade-in">
        <div className="auth-message">
          <PlaySquare size={48} color="var(--text-secondary)" />
          <h2>Enjoy your favorite videos</h2>
          <p>Sign in to access videos that you've liked or saved</p>
          <Link to="/login" className="login-link-btn library-login">Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="library-page fade-in">
      <div className="library-section">
        <div className="section-header">
          <div className="section-title">
            <Clock size={24} />
            <h2>History</h2>
          </div>
          <Link to="/history" className="see-all-link">See all</Link>
        </div>
        <div className="video-grid horizontal-scroll">
          {loading ? (
            Array(4).fill(0).map((_, i) => <div className="scroll-item" key={i}><SkeletonCard /></div>)
          ) : history.length > 0 ? (
            history.map((video, index) => (
              <div className="scroll-item" key={`history-${video.id}-${index}`}>
                <VideoCard video={video} />
              </div>
            ))
          ) : (
            <p className="empty-message">No watch history.</p>
          )}
        </div>
      </div>

      <div className="library-divider"></div>

      <div className="library-section">
        <div className="section-header">
          <div className="section-title">
            <ListVideo size={24} />
            <h2>Playlists</h2>
          </div>
        </div>
        <div className="playlists-grid">
          {loading ? (
            <p>Loading playlists...</p>
          ) : playlists.length > 0 ? (
            playlists.map(playlist => (
              <div className="playlist-card glass" key={playlist.id}>
                <div className="playlist-thumb-placeholder">
                  <ListVideo size={32} color="var(--text-secondary)" />
                  <span className="playlist-count">{playlist.videoIds?.length || 0} videos</span>
                </div>
                <h3>{playlist.name}</h3>
                <p className="playlist-meta">Updated recently</p>
                <Link to={`/playlist/${playlist.id}`} className="view-playlist-btn">View Full Playlist</Link>
              </div>
            ))
          ) : (
            <p className="empty-message">You haven't created any playlists yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Library
