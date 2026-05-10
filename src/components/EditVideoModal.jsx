import React, { useState } from 'react'
import axios from 'axios'
import config from '../config'
import './EditVideoModal.css'

const EditVideoModal = ({ video, onClose, onUpdate, userId }) => {
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description)
  const [status, setStatus] = useState(video.status || 'public')
  const [category, setCategory] = useState(video.category || 'All')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await axios.put(`${config.apiUrl}/videos/${video.id}`, {
        title,
        description,
        status,
        category,
        userId
      })
      onUpdate(res.data)
      onClose()
    } catch (err) {
      alert('Failed to update video')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content glass fade-in">
        <h2>Edit Video Details</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="5" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="All">General</option>
                <option value="React">React</option>
                <option value="Music">Music</option>
                <option value="Gaming">Gaming</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Visibility</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditVideoModal
