import React, { useState, useEffect } from 'react'
import api from '../api/api'
import { Link } from 'react-router-dom'
import './NotificationList.css'

const NotificationList = ({ userId, onClose }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/social/notifications/${userId}`)
        setNotifications(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [userId])

  const markAsRead = async (id) => {
    try {
      await api.put(`/social/notifications/${id}/read`)
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="notification-dropdown glass">
      <div className="notification-header">
        <h3>Notifications</h3>
      </div>
      <div className="notification-content">
        {loading ? (
          <p className="empty-notif">Loading...</p>
        ) : notifications.length > 0 ? (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`notification-item ${n.read ? 'read' : 'unread'}`}
              onClick={() => markAsRead(n.id)}
            >
              <img src={n.fromUser.avatar} alt="avatar" className="notif-avatar" />
              <div className="notif-text">
                <p><strong>{n.fromUser.username}</strong> {n.message}</p>
                <span className="notif-time">
                  {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Just now'}
                </span>
              </div>
              {!n.read && <div className="unread-dot"></div>}
            </div>
          ))
        ) : (
          <p className="empty-notif">No notifications yet.</p>
        )}
      </div>
    </div>
  )
}

export default NotificationList
