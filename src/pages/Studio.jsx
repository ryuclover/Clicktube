import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import config from '../config'
import { AuthContext } from '../context/AuthContext'
import { Edit2, Trash2, Eye, MessageSquare, ThumbsUp, Globe, Lock, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import EditVideoModal from '../components/EditVideoModal'
import './Studio.css'

const Studio = () => {
  const { user } = useContext(AuthContext)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingVideo, setEditingVideo] = useState(null)

  useEffect(() => {
    if (user) {
      const fetchMyVideos = async () => {
        try {
          const res = await axios.get(`${config.apiUrl}/videos`, {
            params: { userId: user.id }
          })
          setVideos(res.data)
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
      fetchMyVideos()
    }
  }, [user])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return
    try {
      await axios.delete(`${config.apiUrl}/videos/${id}`, {
        params: { userId: user.id }
      })
      setVideos(videos.filter(v => v.id !== id))
    } catch (err) {
      alert('Failed to delete video')
    }
  }

  if (!user) return <div className="auth-message">Please login to access Studio.</div>
  if (loading) return <div className="loading-state">Loading your content...</div>

  return (
    <div className="studio-page fade-in">
      <div className="studio-header">
        <h1>Channel content</h1>
        <Link to="/upload" className="upload-btn-studio">Create</Link>
      </div>

      <div className="studio-table-container glass">
        <table className="studio-table">
          <thead>
            <tr>
              <th>Video</th>
              <th>Visibility</th>
              <th>Date</th>
              <th>Views</th>
              <th>Comments</th>
              <th>Likes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.length > 0 ? (
              videos.map((video) => (
                <tr key={video.id}>
                  <td className="video-cell">
                    <div className="studio-video-info">
                      <img src={video.thumbnail} alt="thumb" className="studio-thumb" />
                      <div className="studio-video-text">
                        <span className="studio-video-title">{video.title}</span>
                        <span className="studio-video-desc">{video.description?.substring(0, 50)}...</span>
                      </div>
                    </div>
                  </td>
                  <td className="visibility-cell">
                    {video.status === 'public' && <><Globe size={14} /> Public</>}
                    {video.status === 'private' && <><Lock size={14} /> Private</>}
                    {video.status === 'draft' && <><FileText size={14} /> Draft</>}
                  </td>
                  <td>{new Date(video.createdAt || Date.now()).toLocaleDateString()}</td>
                  <td>{video.viewsCount || 0}</td>
                  <td>0</td>
                  <td>{video.likes || 0}</td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn-studio" 
                      title="Edit"
                      onClick={() => setEditingVideo(video)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn-studio delete" onClick={() => handleDelete(video.id)} title="Delete"><Trash2 size={16} /></button>
                    <Link to={`/video/${video.id}`} className="action-btn-studio" title="View"><Eye size={16} /></Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-row">No videos uploaded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingVideo && (
        <EditVideoModal 
          video={editingVideo} 
          userId={user.id}
          onClose={() => setEditingVideo(null)}
          onUpdate={(updated) => {
            setVideos(videos.map(v => v.id === updated.id ? updated : v))
          }}
        />
      )}
    </div>
  )
}

export default Studio
