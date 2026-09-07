import { useState, useEffect, useContext, useRef } from 'react'
import toast from 'react-hot-toast'
import api, { uploadAvatar } from '../api/api'
import config from '../config'
import { AuthContext } from '../context/AuthContext'
import { Edit2, Save, Upload } from 'lucide-react'
import { getAvatarUrl } from '../utils/display'
import './Profile.css'

const Profile = () => {
  const { user, login } = useContext(AuthContext)
  const [profile, setProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [banner, setBanner] = useState('')
  const [avatar, setAvatar] = useState('')
  const [language, setLanguage] = useState('en')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        if (config.mode === 'mock') return
        try {
          const res = await api.get(`/social/profile/${user.id}`)
          setProfile(res.data)
          setUsername(res.data.username)
          setBio(res.data.bio || '')
          setBanner(res.data.banner || '')
            setAvatar(getAvatarUrl(res.data))
            setLanguage(res.data.language || 'en')
        } catch (err) {
          console.error(err)
        }
      }
      fetchProfile()
    }
  }, [user])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }

    setIsUploadingAvatar(true)
    try {
      const result = await uploadAvatar(file, user.id)
      setAvatar(result.avatar)
      setProfile({ ...profile, profilePicture: result.avatar })
      login({ ...user, avatar: result.avatar, profilePicture: result.avatar })
      toast.success('Avatar updated!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed')
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    const loadingToast = toast.loading('Updating profile...')
    try {
      const res = await api.put(`/social/profile/${user.id}`, { username, bio, banner, language })
      setProfile(res.data)
      login(res.data) // Update global user state
      setIsEditing(false)
      toast.success('Profile updated!', { id: loadingToast })
    } catch {
      toast.error('Update failed', { id: loadingToast })
    }
  }

  if (!user) return <div className="auth-message">Please login to view your profile.</div>
  if (!profile) return <div>Loading...</div>

  return (
    <div className="profile-page fade-in">
      <div className="profile-card glass">
        <div className="profile-header">
          <div className="avatar-container">
            <img 
              src={getAvatarUrl(avatar)} 
              alt={profile.username} 
              className="profile-avatar-large"
              onError={(e) => { e.target.src = '/assets/default-avatar.svg' }}
            />
            <button 
              className="avatar-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              title="Upload new avatar"
            >
              <Upload size={16} />
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
              disabled={isUploadingAvatar}
            />
          </div>
          <div className="profile-main-info">
            {isEditing ? (
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="edit-username-input"
              />
            ) : (
              <h1>{profile.username}</h1>
            )}
            <p className="profile-email">{profile.email}</p>
            <div className="profile-language">
              <label>Language: </label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>
          </div>
          <button className="edit-profile-btn" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
            {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
            <span>{isEditing ? 'Save Profile' : 'Edit Profile'}</span>
          </button>
        </div>

        <div className="profile-section">
          <h3>About</h3>
          {isEditing ? (
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="Tell us about yourself..."
              rows="4"
            />
          ) : (
            <p className="bio-text">{profile.bio || 'No bio yet.'}</p>
          )}
        </div>

        <div className="profile-section">
          <h3>Channel Banner URL</h3>
          {isEditing ? (
            <input 
              type="text"
              value={banner} 
              onChange={(e) => setBanner(e.target.value)} 
              placeholder="Enter image URL for banner..."
            />
          ) : (
            <p className="bio-text">{profile.banner ? 'Banner set' : 'No banner set.'}</p>
          )}
        </div>

        <div className="profile-stats-grid">
          <div className="stat-card">
            <span className="stat-value">{profile.subscribers || 0}</span>
            <span className="stat-label">Subscribers</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">0</span>
            <span className="stat-label">Videos Uploaded</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
