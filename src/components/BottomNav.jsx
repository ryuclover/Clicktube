import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Flame, Users, PlaySquare } from 'lucide-react'
import './BottomNav.css'

const BottomNav = () => {
  const location = useLocation()

  const navItems = [
    { name: 'Home', icon: <Home size={22} />, path: '/' },
    { name: 'Trending', icon: <Flame size={22} />, path: '/trending' },
    { name: 'Subscriptions', icon: <Users size={22} />, path: '/subscriptions' },
    { name: 'Library', icon: <PlaySquare size={22} />, path: '/library' },
  ]

  return (
    <div className="bottom-nav glass show-mobile">
      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.path}
          className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-name">{item.name}</span>
        </Link>
      ))}
    </div>
  )
}

export default BottomNav
