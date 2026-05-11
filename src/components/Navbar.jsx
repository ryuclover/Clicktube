import React, { useState, useEffect, useContext, useRef } from 'react'
import { Search, Bell, Video, User, Menu, Play, LogOut, Upload, Sun, Moon } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/api'
import { AuthContext } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'
import NotificationList from './NotificationList'
import './Navbar.css'

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { user, logout } = useContext(AuthContext)
  const { theme, toggleTheme } = useContext(ThemeContext)
  const navigate = useNavigate()
  const suggestionRef = useRef(null)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([])
        return
      }
      try {
        const res = await api.get('/videos/suggestions', { params: { q: searchTerm } })
        setSuggestions(res.data)
      } catch (err) {
        console.error(err)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (searchTerm) {
      navigate(`/search/${searchTerm}`)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (title) => {
    setSearchTerm(title)
    navigate(`/search/${title}`)
    setShowSuggestions(false)
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

      <div className="nav-center" ref={suggestionRef}>
        <form className="search-bar" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Search videos..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          <button type="submit" className="search-btn">
            <Search size={18} />
          </button>
        </form>
        {showSuggestions && suggestions.length > 0 && (
          <div className="search-suggestions glass fade-in">
            {suggestions.map((s, i) => (
              <div 
                key={i} 
                className="suggestion-item"
                onClick={() => handleSuggestionClick(s)}
              >
                <Search size={14} />
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="nav-right">
        <button className="icon-btn theme-toggle" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
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
