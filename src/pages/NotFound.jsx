import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home, Search } from 'lucide-react'
import './NotFound.css'

const NotFound = () => {
  return (
    <div className="not-found-page fade-in">
      <Helmet>
        <title>404 - Page Not Found | Clicktube</title>
      </Helmet>
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Oops! Page not found</h1>
        <p className="not-found-desc">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="not-found-btn primary">
            <Home size={18} />
            Go Home
          </Link>
          <Link to="/search" className="not-found-btn secondary">
            <Search size={18} />
            Search Videos
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
