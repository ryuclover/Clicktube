import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { getAvatarUrl } from '../utils/display'
import { formatSubscribers } from '../utils/format'
import './ChannelResultCard.css'

const ChannelResultCard = ({ channel }) => {
  const { user } = useContext(AuthContext)

  return (
    <div className="channel-result-card fade-in">
      <Link to={`/channel/${channel.id}`} className="channel-result-avatar">
        <img src={getAvatarUrl(channel.avatar)} alt={channel.username} onError={(e) => { e.target.src = '/assets/default-avatar.svg' }} />
      </Link>
      <div className="channel-result-info">
        <Link to={`/channel/${channel.id}`}>
          <h3>{channel.username} <CheckCircle size={16} fill="#a1a1aa" color="var(--bg-color)" /></h3>
        </Link>
        <div className="channel-result-meta">
          <span>@{channel.username.toLowerCase().replace(/\s/g, '')}</span>
          <span>•</span>
          <span>{formatSubscribers(channel.subscribers || 0)}</span>
        </div>
        <p className="channel-result-bio">{channel.bio || 'No biography available.'}</p>
      </div>
      <div className="channel-result-action">
        <button className="subscribe-btn" disabled={user?.id === channel.id}>
          {user?.id === channel.id ? 'Your channel' : 'Subscribe'}
        </button>
      </div>
    </div>
  )
}

export default ChannelResultCard
