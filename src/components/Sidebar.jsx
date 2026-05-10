import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, PlaySquare, Clock, ThumbsUp, Music2, Gamepad2, Trophy, Flame, Users, Video } from 'lucide-react'
import './Sidebar.css'

const categories = [
  { name: 'Home', icon: <Home size={20} />, path: '/' },
  { name: 'Trending', icon: <Flame size={20} />, path: '/trending' },
  { name: 'Subscriptions', icon: <Users size={20} />, path: '/subscriptions' },
  { type: 'divider' },
  { name: 'Library', icon: <PlaySquare size={20} />, path: '/library' },
  { name: 'History', icon: <Clock size={20} />, path: '/history' },
  { name: 'Studio', icon: <Video size={20} />, path: '/studio' },
  { name: 'Liked Videos', icon: <ThumbsUp size={20} />, path: '/liked' },
  { type: 'divider', label: 'Explore' },
  { name: 'Music', icon: <Music2 size={20} />, path: '/music' },
  { name: 'Gaming', icon: <Gamepad2 size={20} />, path: '/gaming' },
  { name: 'Sports', icon: <Trophy size={20} />, path: '/sports' },
]

const Sidebar = () => {
  const location = useLocation()

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        {categories.map((item, index) => (
          item.type === 'divider' ? (
            <div key={index} className="sidebar-divider">
              {item.label && <span className="divider-label">{item.label}</span>}
            </div>
          ) : (
            <Link 
              key={item.name} 
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-name">{item.name}</span>
            </Link>
          )
        ))}
      </div>
      <div className="sidebar-footer">
        <p>© 2024 Clicktube</p>
      </div>
    </aside>
  )
}

export default Sidebar
