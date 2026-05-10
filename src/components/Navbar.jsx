import React, { useState, useContext } from 'react'
import { Search, Bell, Video, User, Menu, Play, LogOut, Upload } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import NotificationList from './NotificationList'
import './Navbar.css'

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (searchTerm) {
      navigate(`/search/${searchTerm}`)
    }
  }

  return (
    <nav className="navbar glass">
      <div className="nav-left">
        <button className="icon-btn menu-btn">
          <Menu size={20} />
        </button>
        <Link to="/" className="logo">
          <Play className="logo-icon" size={28} color="#ff0000" fill="#ff0000" />
          <span>Clicktube</span>
        </Link>
      </div>

      <div className="nav-center">
        <form className="search-bar" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Search videos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="search-btn">
            <Search size={18} />
          </button>
        </form>
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <Link to="/upload" className="icon-btn hide-mobile" title="Upload Video">
              <Upload size={20} />
            </Link>
            <div className="notification-wrapper">
              <button className="icon-btn hide-mobile" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
              </button>
              {showNotifications && (
                <NotificationList userId={user.id} onClose={() => setShowNotifications(false)} />
              )}
            </div>
            <div className="user-profile-nav">
              <Link to="/profile">
                <img src={user.avatar} alt={user.username} className="nav-avatar" />
              </Link>
              <button className="logout-btn" onClick={logout} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          </>
        ) : (
          <Link to="/login" className="login-link-btn">
            <User size={18} />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar
