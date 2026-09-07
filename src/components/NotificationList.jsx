import React, { useState, useEffect } from 'react'
import api from '../api/api'
import { Link } from 'react-router-dom'
import { getAvatarUrl, formatDateBR } from '../utils/display'
import './NotificationList.css'

const NotificationList = ({ userId, onClose }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/social/notifications/${userId}`, { params: { page, limit: 20 } })
        const data = res.data.notifications || res.data
        setNotifications(prev => page === 1 ? data : [...prev, ...data])
        setHasMore(data.length === 20)
        setTotal(res.data.total || data.length)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [userId, page])

  const loadMore = () => {
    if (!loading && hasMore) setPage(p => p + 1)
  }

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
          <>
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`notification-item ${n.read ? 'read' : 'unread'}`}
                onClick={() => markAsRead(n.id)}
              >
                <img src={getAvatarUrl(n.fromUser)} alt="avatar" className="notif-avatar" />
                <div className="notif-text">
                  <p><strong>{n.fromUser.username}</strong> {n.message}</p>
                  <span className="notif-time">
                    {formatDateBR(n.createdAt)}
                  </span>
                </div>
                {!n.read && <div className="unread-dot"></div>}
              </div>
            ))}
            {hasMore && (
              <button className="load-more-btn" onClick={loadMore}>
                Load more
              </button>
            )}
          </>
        ) : (
          <p className="empty-notif">No notifications</p>
        )}
      </div>
    </div>
  )
}

export default NotificationList
