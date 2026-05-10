import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import config from '../config'
import { AuthContext } from '../context/AuthContext'
import { Trash2, ShieldAlert } from 'lucide-react'
import './Admin.css'

const Admin = () => {
  const { user } = useContext(AuthContext)
  const [videos, setVideos] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Very basic admin check (in a real app this would be a secure backend check)
  const isAdmin = user && (user.email === 'test@user' || user.email === 'admin@clicktube.com')

  useEffect(() => {
    if (isAdmin) {
      const fetchAdminData = async () => {
        try {
          const [videosRes, usersRes] = await Promise.all([
            axios.get(`${config.apiUrl}/videos`),
            axios.get(`${config.apiUrl}/auth/search?q=`) // Empty query returns all in our simple implementation, or just a new route
          ])
          setVideos(videosRes.data)
          setUsers(usersRes.data)
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
    try {
      // In our simple backend, the delete route checks if userId matches. 
      // We would need to pass an admin flag or use a dedicated admin route.
      // For demonstration, we'll assume the backend allows it for now if we pass the owner's ID (or bypass it).
      // Let's modify the backend delete route to accept an admin flag for simplicity.
      const video = videos.find(v => v.id === id);
      await axios.delete(`${config.apiUrl}/videos/${id}`, {
        params: { userId: video.userId, adminOverride: true } 
      })
      setVideos(videos.filter(v => v.id !== id))
    } catch (err) {
      alert('Failed to delete video')
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
