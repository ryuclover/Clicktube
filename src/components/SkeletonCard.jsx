import React from 'react'
import './SkeletonCard.css'

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-thumbnail"></div>
      <div className="skeleton-info">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-text">
          <div className="skeleton-title"></div>
          <div className="skeleton-meta"></div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonCard
