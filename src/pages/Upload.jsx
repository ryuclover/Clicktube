import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import config from '../config'
import { AuthContext } from '../context/AuthContext'
import { Upload as UploadIcon, X } from 'lucide-react'
import './Upload.css'

const Upload = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('All')
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [status, setStatus] = useState('public')
  const [uploading, setUploading] = useState(false)
  
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = Math.floor(video.duration);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!user) return alert('Please login to upload')
    if (!videoFile) return alert('Please select a video file')

    setUploading(true)
    const duration = await getVideoDuration(videoFile);
    
    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('category', category)
    formData.append('status', status)
    formData.append('userId', user.id)
    formData.append('duration', duration)
    formData.append('video', videoFile)
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile)

    try {
      await axios.post(`${config.apiUrl}/videos/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      navigate('/')
    } catch (err) {
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-page fade-in">
      <div className="upload-container glass">
        <h2>Upload Video</h2>
        <form onSubmit={handleUpload}>
          <div className="file-inputs">
            <div className="file-input">
              <label>Video File*</label>
              <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} required />
            </div>
            <div className="file-input">
              <label>Thumbnail (Optional)</label>
              <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files[0])} />
            </div>
          </div>
          
          <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows="4" />
          
          <div className="form-group-row">
            <div className="input-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="All">General</option>
                <option value="React">React</option>
                <option value="Music">Music</option>
                <option value="Gaming">Gaming</option>
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
            {uploading ? 'Uploading...' : 'Publish Video'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Upload
