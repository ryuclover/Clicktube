import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/api'
import { AuthContext } from '../context/AuthContext'
import { CATEGORIES } from '../utils/categories'
import { Upload as UploadIcon, X, Film, Image } from 'lucide-react'
import './Upload.css'

const Upload = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(CATEGORIES.find(c => c !== 'All') || 'React')
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [status, setStatus] = useState('public')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        const duration = Math.floor(video.duration)
        const minutes = Math.floor(duration / 60)
        const seconds = duration % 60
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
      video.src = URL.createObjectURL(file)
    })
  }

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!user) return toast.error('Please login to upload')
    if (!videoFile) return toast.error('Please select a video file')

    const loadingToast = toast.loading('Uploading video...')
    setUploading(true)
    setUploadProgress(0)

    try {
      const duration = await getVideoDuration(videoFile)

      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('category', category)
      formData.append('status', status)
      formData.append('userId', user.id)
      formData.append('duration', duration)
      formData.append('video', videoFile)
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile)

      await api.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(pct)
          toast.loading(`Uploading... ${pct}%`, { id: loadingToast })
        },
      })

      toast.success('Video published successfully!', { id: loadingToast })
      navigate('/')
    } catch (err) {
      toast.error('Upload failed. Please try again.', { id: loadingToast })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // Remove the All option since it's not a real category for upload
  const uploadCategories = CATEGORIES.filter(c => c !== 'All')

  return (
    <div className="upload-page fade-in">
      <div className="upload-container glass">
        <h2>Upload Video</h2>
        <form onSubmit={handleUpload}>
          <div className="file-inputs">
            <div className="file-input">
              <label>Video File *</label>
              <input type="file" accept="video/*" onChange={handleVideoChange} required />
              {videoPreview && (
                <video className="file-preview video-preview" src={videoPreview} controls />
              )}
            </div>
            <div className="file-input">
              <label>Thumbnail (Optional)</label>
              <input type="file" accept="image/*" onChange={handleThumbnailChange} />
              {thumbnailPreview && (
                <img className="file-preview thumbnail-preview" src={thumbnailPreview} alt="Thumbnail preview" />
              )}
            </div>
          </div>

          {uploading && (
            <div className="upload-progress-bar">
              <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              <span className="upload-progress-label">{uploadProgress}%</span>
            </div>
          )}

          <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows="4" />

          <div className="form-group-row">
            <div className="input-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {uploadCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Visibility</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <button type="submit" className="upload-btn" disabled={uploading}>
            {uploading ? `Uploading... ${uploadProgress}%` : 'Publish Video'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Upload
