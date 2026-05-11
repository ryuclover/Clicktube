import React, { useState, useEffect, useContext } from 'react'
import api from '../api/api'
import config from '../config'
import { AuthContext } from '../context/AuthContext'
import VideoCard from '../components/VideoCard'
import { Clock } from 'lucide-react'
import './History.css'

const History = () => {
  const { user } = useContext(AuthContext)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        if (config.mode === 'mock') return
        try {
          const res = await api.get(`/social/history/${user.id}`)
          setHistory(res.data)
        } catch (err) {
          console.error(err)
        }
      }
      fetchHistory()
    }
  }, [user])

  if (!user) return <div className="auth-message">Please login to view your history.</div>

  return (
    <div className="history-page fade-in">
      <div className="history-header">
        <Clock size={28} />
        <h1>Watch History</h1>
      </div>
      
      {history.length > 0 ? (
        <div className="history-grid">
          {history.map((video, index) => (
            <div key={`${video.id}-${index}`} className="history-item">
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-message">You haven't watched any videos yet.</p>
      )}
    </div>
  )
}

export default History
