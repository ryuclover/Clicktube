import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import config from '../config'
import { AuthContext } from '../context/AuthContext'
import { User, Edit2, Save, History as HistoryIcon } from 'lucide-react'
import './Profile.css'

const Profile = () => {
  const { user, login } = useContext(AuthContext)
  const [profile, setProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [banner, setBanner] = useState('')

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        if (config.mode === 'mock') return
        try {
          const res = await axios.get(`${config.apiUrl}/social/profile/${user.id}`)
          setProfile(res.data)
          setUsername(res.data.username)
          setBio(res.data.bio || '')
          setBanner(res.data.banner || '')
        } catch (err) {
          console.error(err)
        }
      }
      fetchProfile()
    }
  }, [user])

  const handleSave = async () => {
    try {
      const res = await axios.put(`${config.apiUrl}/social/profile/${user.id}`, { username, bio, banner })
      setProfile(res.data)
      login(res.data, localStorage.getItem('token')) // Update global user state
      setIsEditing(false)
    } catch (err) {
      alert('Failed to update profile')
    }
  }

  if (!user) return <div className="auth-message">Please login to view your profile.</div>
  if (!profile) return <div>Loading...</div>

  return (
    <div className="profile-page fade-in">
      <div className="profile-card glass">
        <div className="profile-header">
          <img src={profile.avatar} alt={profile.username} className="profile-avatar-large" />
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
