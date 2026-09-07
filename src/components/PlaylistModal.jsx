import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../api/api'
import { Plus, Check, X } from 'lucide-react'
import './PlaylistModal.css'

const PlaylistModal = ({ videoId, userId, onClose }) => {
  const [playlists, setPlaylists] = useState([])
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await api.get(`/social/playlists/${userId}`)
        setPlaylists(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchPlaylists()
  }, [userId])

  const toggleVideo = async (playlistId) => {
    try {
      const res = await api.post(`/social/playlists/${playlistId}/video`, { videoId })
      setPlaylists(playlists.map(p => p.id === playlistId ? res.data : p))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating playlist')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newPlaylistName.trim()) return
    try {
      const res = await api.post(`/social/playlists`, {
        name: newPlaylistName,
        videoIds: [videoId]
      })
      setPlaylists([...playlists, res.data])
      setNewPlaylistName('')
      setShowCreate(false)
      toast.success('Playlist created')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating playlist')
    }
  }

  return (
    <div className="modal-overlay">
      <div className="playlist-modal glass fade-in">
        <div className="modal-header">
          <h3>Save to...</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="playlist-list">
          {playlists.map(playlist => (
            <div key={playlist.id} className="playlist-item" onClick={() => toggleVideo(playlist.id)}>
              <div className={`checkbox ${playlist.videoIds.includes(videoId) ? 'checked' : ''}`}>
                {playlist.videoIds.includes(videoId) && <Check size={14} />}
              </div>
              <span>{playlist.name}</span>
            </div>
          ))}
        </div>

        <div className="create-section">
          {showCreate ? (
            <form onSubmit={handleCreate} className="create-form">
              <label>Name</label>
              <input 
                type="text" 
                placeholder="Enter playlist name..." 
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="create-btn">Create</button>
            </form>
          ) : (
            <button className="add-btn" onClick={() => setShowCreate(true)}>
              <Plus size={18} /> Create new playlist
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlaylistModal
