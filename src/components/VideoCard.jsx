import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { formatViews } from '../utils/format'
import './VideoCard.css'

const VideoCard = ({ video, layout = 'vertical' }) => {
  return (
    <div className={`video-card ${layout} fade-in`}>
      <Link to={`/video/${video.id}`} className="thumbnail-container">
        <img src={video.thumbnail} alt={video.title} className="thumbnail" />
        <span className="duration">{video.duration || '0:00'}</span>
      </Link>
      <div className="video-info">
        <Link to={`/channel/${video.userId}`} className="channel-avatar">
          <img src={video.channelAvatar} alt={video.channel} />
        </Link>
        <div className="text-info">
          <Link to={`/video/${video.id}`}>
            <h3 className="video-title">{video.title}</h3>
          </Link>
          <Link to={`/channel/${video.userId}`} className="channel-name">
            {video.channel} <CheckCircle size={12} fill="#a1a1aa" color="var(--bg-color)" />
          </Link>
          <p className="video-meta">{formatViews(video.viewsCount || 0)} • {video.timestamp}</p>
        </div>
      </div>
    </div>
  )
}

export default VideoCard
