import React, { useState, useEffect, useContext } from 'react'
import toast from 'react-hot-toast'
import api from '../api/api'
import config from '../config'
import { AuthContext } from '../context/AuthContext'
import { Trash2, ShieldAlert } from 'lucide-react'
import './Admin.css'

const Admin = () => {
  const { user } = useContext(AuthContext)
  const [videos, setVideos] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const isAdmin = user && (user.role === 'admin' || user.email === 'test@user' || user.email === 'admin@clicktube.com')

  useEffect(() => {
    if (isAdmin) {
      const fetchAdminData = async () => {
        try {
          const [videosRes, usersRes] = await Promise.all([
            api.get('/videos', { params: { limit: 100 } }),
            api.get('/auth/search?q=')
          ])
          setVideos(videosRes.data.videos || [])
          setUsers(usersRes.data || [])
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
      fetchAdminData()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Delete this video globally?')) return
    const loadingToast = toast.loading('Deleting video...')
    try {
      await api.delete(`/videos/${id}`, {
        params: { userId: user.id } 
      })
      setVideos(videos.filter(v => v.id !== id))
      toast.success('Video removed globally', { id: loadingToast })
    } catch (err) {
      toast.error('Moderation action failed', { id: loadingToast })
    }
  }

  if (!isAdmin) {
    return (
      <div className="admin-page fade-in">
        <div className="auth-message">
          <ShieldAlert size={48} color="#ef4444" />
          <h2>Access Denied</h2>
          <p>You do not have administrator privileges.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page fade-in">
      <div className="admin-header">
        <h1><ShieldAlert size={28} color="#ef4444" /> Admin Dashboard</h1>
      </div>

      <div className="admin-stats glass">
        <div className="stat-box">
          <h3>Total Videos</h3>
          <p>{videos.length}</p>
        </div>
        <div className="stat-box">
          <h3>Total Users</h3>
          <p>{users.length}</p>
        </div>
      </div>

      <div className="admin-section glass">
        <h2>Global Video Moderation</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Channel</th>
              <th>Views</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5">Loading...</td></tr>
            ) : videos.map(v => (
              <tr key={v.id}>
                <td className="id-cell">{v.id.substring(0, 8)}...</td>
                <td>{v.title}</td>
                <td>{v.channel}</td>
                <td>{v.viewsCount || 0}</td>
                <td>
                  <button className="delete-btn" onClick={() => handleDeleteVideo(v.id)}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Admin
