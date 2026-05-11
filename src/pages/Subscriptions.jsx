import React, { useState, useEffect, useContext } from 'react'
import api from '../api/api'
import config from '../config'
import { AuthContext } from '../context/AuthContext'
import { Users, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Subscriptions.css'

const Subscriptions = () => {
  const { user } = useContext(AuthContext)
  const [channels, setChannels] = useState([])

  useEffect(() => {
    if (user) {
      const fetchSubs = async () => {
        if (config.mode === 'mock') return
        try {
          const res = await api.get(`/social/subscriptions/${user.id}`)
          setChannels(res.data)
        } catch (err) {
          console.error(err)
        }
      }
      fetchSubs()
    }
  }, [user])

  if (!user) return <div className="auth-message">Please login to view your subscriptions.</div>

  return (
    <div className="subs-page fade-in">
      <div className="subs-header">
        <Users size={28} />
        <h1>Subscriptions</h1>
      </div>
      
      {channels.length > 0 ? (
        <div className="channels-grid">
          {channels.map((channel) => (
            <Link key={channel.id} to={`/channel/${channel.id}`} className="channel-card glass">
              <img src={channel.avatar} alt={channel.username} className="channel-avatar-large" />
              <div className="channel-info">
                <h3>{channel.username} <CheckCircle size={16} fill="#a1a1aa" color="var(--bg-color)" /></h3>
                <span>Subscribed</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-message">You haven't subscribed to any channels yet.</p>
      )}
    </div>
  )
}

export default Subscriptions
