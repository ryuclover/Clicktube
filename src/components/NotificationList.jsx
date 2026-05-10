import React, { useState, useEffect } from 'react'
import axios from 'axios'
import config from '../config'
import { Link } from 'react-router-dom'
import './NotificationList.css'

const NotificationList = ({ userId, onClose }) => {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${config.apiUrl}/social/notifications/${userId}`)
        setNotifications(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchNotifications()
  }, [userId])

  const markAsRead = async (id) => {
    try {
      await axios.put(`${config.apiUrl}/social/notifications/${id}/read`)
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
        {notifications.length > 0 ? (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`notification-item ${n.read ? 'read' : 'unread'}`}
              onClick={() => markAsRead(n.id)}
            >
              <img src={n.fromUser.avatar} alt="avatar" className="notif-avatar" />
              <div className="notif-text">
                <p><strong>{n.fromUser.username}</strong> {n.message}</p>
                <span className="notif-time">{new Date(n.createdAt).toLocaleDateString()}</span>
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
