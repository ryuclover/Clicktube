import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import api from '../api/api'
import './EditVideoModal.css'

const EditVideoModal = ({ video, onClose, onUpdate, userId }) => {
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description)
  const [status, setStatus] = useState(video.status || 'public')
  const [category, setCategory] = useState(video.category || 'All')
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(video.thumbnail || '')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    setTitle(video.title)
    setDescription(video.description)
    setStatus(video.status || 'public')
    setCategory(video.category || 'All')
    setThumbnailFile(null)
    setThumbnailPreview(video.thumbnail || '')
  }, [video])

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }

    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const confirmed = window.confirm('Save these changes to the video?')
    if (!confirmed) return

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('status', status)
      formData.append('category', category)
      formData.append('userId', userId)
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile)
      }

      const res = await api.put(`/videos/${video.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      onUpdate(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update video')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass fade-in" role="dialog" aria-modal="true" aria-label="Edit video details" ref={dialogRef} onClick={(e) => e.stopPropagation()}>
        <h2>Edit Video Details</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Thumbnail</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
            />
            {thumbnailPreview && (
              <img className="thumbnail-preview" src={thumbnailPreview} alt="Thumbnail preview" />
            )}
          </div>

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
