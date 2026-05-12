import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/api'
import { AuthContext } from '../context/AuthContext'
import { Trash2, ExternalLink, ShieldAlert, Search, RefreshCw } from 'lucide-react'
import './Admin.css'

const Admin = () => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  useEffect(() => {
    // Redireciona se não for admin
    if (!user || user.role !== 'admin') {
      toast.error('Access denied. Admin only.')
      navigate('/')
      return
    }
    fetchVideos()
  }, [user])

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const res = await api.get('/videos', { params: { limit: 100 } })
      setVideos(res.data.videos)
    } catch (err) {
      toast.error('Failed to load videos')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) return

    try {
      await api.delete(`/videos/${id}`, { params: { userId: user.id } })
      setVideos(videos.filter(v => v.id !== id))
      toast.success('Video removed from platform')
    } catch (err) {
      toast.error('Failed to delete video')
    }
  }

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.channel.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="admin-loading"><RefreshCw className="spinner" /> Loading Dashboard...</div>

  return (
    <div className="admin-dashboard fade-in">
      <header className="admin-header glass">
        <div className="header-title">
          <ShieldAlert color="#ff4444" />
          <h1>Admin Moderation</h1>
        </div>
        <div className="admin-stats">
          <div className="stat-card">
            <span>Total Videos</span>
            <strong>{videos.length}</strong>
          </div>
        </div>
      </header>

      <div className="admin-controls glass">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by title or channel..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="refresh-btn" onClick={fetchVideos}>
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="admin-table-container glass">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>Video Details</th>
              <th>Channel</th>
              <th>Views</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVideos.map(video => (
              <tr key={video.id}>
                <td>
                  <img src={video.thumbnail} alt={video.title} className="admin-thumb" />
                </td>
                <td className="video-cell">
                  <div className="title-row">
                    <strong>{video.title}</strong>
                    <a href={`/video/${video.id}`} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <span className="video-id">ID: {video.id}</span>
                </td>
                <td>{video.channel}</td>
                <td>{video.viewsCount}</td>
                <td>
                  <button 
                    className="delete-action-btn" 
                    onClick={() => handleDelete(video.id)}
                    title="Delete Video"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredVideos.length === 0 && (
          <div className="empty-admin">No videos found matching your search.</div>
        )}
      </div>
    </div>
  )
}

export default Admin
