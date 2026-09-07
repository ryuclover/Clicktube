import React, { useState, useEffect, useContext, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import api from '../api/api'
import config from '../config'
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, CheckCircle, Send, FolderPlus, Trash2 } from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import VideoCard from '../components/VideoCard'
import PlaylistModal from '../components/PlaylistModal'
import EditVideoModal from '../components/EditVideoModal'
import CustomPlayer from '../components/CustomPlayer'
import Skeleton from '../components/Skeleton'
import { getAvatarUrl } from '../utils/display'
import './VideoDetail.css'

const VideoDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  
  const [video, setVideo] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [relatedVideos, setRelatedVideos] = useState([])
  const [uploaderSubscribers, setUploaderSubscribers] = useState(0)
  const [showVideoMenu, setShowVideoMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const menuRef = useRef(null)

  // Effect 1: Fetch video data, related videos, comments + increment view.
  // P3: parallel fetches — video first, then profile/related/comments concurrently.
  // Depends only on [id] — view is NOT re-counted when user logs in/out.
  useEffect(() => {
    let cancelled = false
    const fetchVideoData = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/videos/${id}`)
        if (cancelled) return
        setVideo(res.data)

        const [profileRes, relatedRes, commentsRes] = await Promise.allSettled([
          api.get(`/social/profile/${res.data.userId}`),
          api.get('/videos', { params: { category: res.data.category, limit: 7 } }),
          api.get(`/social/comments/${id}`),
        ])
        if (cancelled) return

        if (profileRes.status === 'fulfilled') {
          setUploaderSubscribers(profileRes.value.data.subscribers || 0)
        } else {
          console.error('Error fetching uploader profile', profileRes.reason)
        }

        if (relatedRes.status === 'fulfilled') {
          setRelatedVideos(((relatedRes.value.data.videos || []).filter(v => v.id !== id)))
        } else {
          console.error('Error fetching related videos', relatedRes.reason)
        }

        if (commentsRes.status === 'fulfilled') {
          const payload = commentsRes.value.data
          setComments(payload.comments || payload)
        } else {
          console.error('Error fetching comments', commentsRes.reason)
        }

        api.post(`/videos/${id}/view`).catch(() => {})
      } catch (err) {
        if (!cancelled) toast.error('Video not found or unavailable.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchVideoData()
    return () => { cancelled = true }
  }, [id])

  // Effect 2: Track watch history. Backend now uses upsert so safe to re-run.
  // P3: identity comes from the auth cookie — no userId in body.
  useEffect(() => {
    if (!user) return
    api.post('/social/history', { videoId: id }).catch(() => {})
  }, [id, user])

  // Effect 3: Check subscription when video owner or logged-in user changes.
  useEffect(() => {
    if (!user || !video) return
    if (video.userId === user.id) {
      setSubscribed(false)
      return
    }
    api.get(`/social/subscriptions/${user.id}`)
      .then(res => setSubscribed(res.data.some(sub => sub.id === video.userId)))
      .catch(err => console.error('Error checking subscription', err))
  }, [video?.userId, user])

  const handleLike = async (type) => {
    if (!user) return toast.error('Please login to like')
    try {
      await api.post('/social/like', { videoId: id, type })
      if (type === 'like') {
        setLiked(!liked)
        setDisliked(false)
        toast.success(liked ? 'Like removed' : 'Video liked')
      } else {
        setDisliked(!disliked)
        setLiked(false)
        toast.success(disliked ? 'Dislike removed' : 'Video disliked')
      }
    } catch (err) {
      toast.error('Action failed')
    }
  }

  const [replyingTo, setReplyingTo] = useState(null)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowVideoMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubscribe = async () => {
    if (!user) return toast.error('Please login to subscribe')
    if (video.userId === user.id) return toast.error('You cannot subscribe to your own channel')
    try {
      const res = await api.post('/social/subscribe', { channelId: video.userId })
      setSubscribed(res.data.subscribed)
      setUploaderSubscribers(prev => res.data.subscribed ? prev + 1 : Math.max(0, prev - 1))
      toast.success(res.data.subscribed ? 'Subscribed!' : 'Unsubscribed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  const handleDeleteVideo = async () => {
    if (!user || user.id !== video.userId) return
    const confirmed = window.confirm('Delete this video permanently? This cannot be undone.')
    if (!confirmed) return

    try {
      await api.delete(`/videos/${video.id}`)
      toast.success('Video deleted')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete video')
    }
  }

  const handleOpenEdit = () => {
    if (!user || user.id !== video.userId) return
    const confirmed = window.confirm('Open the edit panel for this video?')
    if (confirmed) {
      setShowEditModal(true)
    }
  }

  const handleComment = async (e, parentId = null) => {
    if (e) e.preventDefault()
    if (!user) return toast.error('Please login to comment')
    
    const text = parentId ? replyingTo.text : newComment
    if (!text.trim()) return

    try {
      const res = await api.post('/social/comment', {
        videoId: id,
        text,
        parentId
      })
      setComments([res.data, ...comments])
      setNewComment('')
      setReplyingTo(null)
      toast.success('Comment added')
    } catch (err) {
      toast.error('Failed to post comment')
    }
  }

  if (loading) {
    return (
      <div className="video-detail-container fade-in">
        <div className="video-section">
          <Skeleton type="video-player" />
          <div className="video-info-section" style={{ marginTop: '20px' }}>
            <Skeleton type="title" />
            <div className="video-actions-bar" style={{ display: 'flex', gap: '15px' }}>
              <Skeleton type="circle" />
              <div style={{ flex: 1 }}>
                <Skeleton type="text" classes="w-1/4" />
                <Skeleton type="text" classes="w-1/6" />
              </div>
            </div>
          </div>
        </div>
        <div className="related-videos-section">
          <Skeleton type="title" />
          {[1, 2, 3, 4].map(i => <div key={i} style={{ marginBottom: '15px' }}><Skeleton type="thumbnail" /></div>)}
        </div>
      </div>
    )
  }

  if (!video) return <div className="error-msg">Video not found</div>

  const backendBaseUrl = config.apiUrl.replace('/api', '')
  const videoUrl = video.url ? (video.url.startsWith('http') ? video.url : `${backendBaseUrl}${video.url}`) : ''

  return (
    <div className="video-detail-container fade-in">
      <Helmet>
        <title>{video.title} - Clicktube</title>
        <meta name="description" content={video.description?.substring(0, 160)} />
        <meta property="og:title" content={video.title} />
        <meta property="og:description" content={video.description?.substring(0, 160)} />
        <meta property="og:image" content={video.thumbnail} />
        <meta property="og:type" content="video.other" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <div className="video-section">
        <div className="player-wrapper">
          {video.url && (video.url.includes('youtube.com') || video.url.includes('youtu.be')) ? (
             <iframe src={video.url.includes('watch?v=') ? video.url.replace('watch?v=', 'embed/') : video.url.replace('youtu.be/', 'youtube.com/embed/')} title={video.title} frameBorder="0" allowFullScreen></iframe>
          ) : (
            video.url ? (
              <CustomPlayer src={videoUrl} thumbnail={video.thumbnail} totalDuration={video.duration} />
            ) : (
              <div className="no-video">No video available</div>
            )
          )}
        </div>
        
        <div className="video-info-section">
          <h1 className="video-title">{video.title}</h1>
          
          <div className="video-actions-bar">
            <div className="channel-info">
              <Link to={`/channel/${video.userId}`} className="channel-avatar">
                <img src={getAvatarUrl(video.channelAvatar)} alt={video.channel} onError={(e) => { e.target.src = '/assets/default-avatar.svg' }} />
              </Link>
              <div className="channel-text">
                <Link to={`/channel/${video.userId}`} className="channel-name">
                  {video.channel} <CheckCircle size={14} fill="#a1a1aa" color="var(--bg-color)" />
                </Link>
                <span className="sub-count">{uploaderSubscribers} subscribers</span>
              </div>
              <button 
                className={`subscribe-btn ${subscribed ? 'subscribed' : ''}`}
                onClick={handleSubscribe}
                disabled={video.userId === user?.id}
              >
                {video.userId === user?.id ? 'Your channel' : (subscribed ? 'Subscribed' : 'Subscribe')}
              </button>
            </div>
            
            <div className="action-buttons">
              <div className="like-dislike">
                <button 
                  className={`action-btn like ${liked ? 'active' : ''}`} 
                  onClick={() => handleLike('like')}
                >
                  <ThumbsUp size={18} fill={liked ? 'currentColor' : 'none'} /> {video.likes + (liked ? 1 : 0)}
                </button>
                <div className="btn-divider"></div>
                <button 
                  className={`action-btn dislike ${disliked ? 'active' : ''}`}
                  onClick={() => handleLike('dislike')}
                >
                  <ThumbsDown size={18} fill={disliked ? 'currentColor' : 'none'} />
                </button>
              </div>
              <button className="action-btn"><Share2 size={18} /> Share</button>
              <button 
                className="action-btn" 
                onClick={() => user ? setShowPlaylistModal(true) : toast.error('Please login to save videos')}
              >
                <FolderPlus size={18} /> Save
              </button>
              <button className="action-btn hide-tablet"><Download size={18} /> Download</button>
              <div className="more-actions-wrapper" ref={menuRef}>
                <button
                  type="button"
                  className="action-btn more-actions-btn"
                  onClick={() => setShowVideoMenu((prev) => !prev)}
                  aria-label="More options"
                >
                  <MoreHorizontal size={18} />
                </button>

                {showVideoMenu && (
                  <div className="more-actions-menu glass fade-in">
                    <button type="button" onClick={() => { handleCopyLink(); setShowVideoMenu(false) }}>
                      Copy link
                    </button>
                    <button type="button" onClick={() => { user ? setShowPlaylistModal(true) : toast.error('Please login to save videos'); setShowVideoMenu(false) }}>
                      Save to playlist
                    </button>
                    {user?.id === video.userId && (
                      <>
                        <button type="button" onClick={() => { handleOpenEdit(); setShowVideoMenu(false) }}>
                        Edit
                        </button>
                        <button type="button" className="danger" onClick={() => { handleDeleteVideo(); setShowVideoMenu(false) }}>
                          <Trash2 size={14} /> Delete video
                        </button>
                      </>
                    )}
                    <button type="button" onClick={() => { toast('Report sent'); setShowVideoMenu(false) }}>
                      Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="description-box">
            <div className="description-meta">
              <span>{video.views}</span>
              <span>{video.timestamp}</span>
            </div>
            <p className="description-text">{video.description}</p>
            <button className="show-more">Show more</button>
          </div>
          
          <div className="comments-section">
            <h3>{comments.length} Comments</h3>
            
            <form className="comment-input-area" onSubmit={handleComment}>
              <img src={getAvatarUrl(user)} alt="me" className="comment-avatar" />
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="Add a comment..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" className="send-btn"><Send size={18} /></button>
              </div>
            </form>

            <div className="comments-list">
              {comments.filter(c => !c.parentId).map(comment => (
                <div key={comment.id} className="comment-group">
                  <div className="comment-item">
                    <img src={getAvatarUrl(comment.avatar)} alt={comment.username} className="comment-avatar" />
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-author">{comment.username}</span>
                        <span className="comment-date">{comment.timestamp}</span>
                      </div>
                      <p className="comment-text">{comment.text}</p>
                      <div className="comment-actions">
                        <button><ThumbsUp size={14} /> 0</button>
                        <button><ThumbsDown size={14} /></button>
                        <button className="reply-btn" onClick={() => setReplyingTo({ id: comment.id, text: '' })}>Reply</button>
                      </div>
                      
                      {replyingTo?.id === comment.id && (
                        <div className="reply-input-wrapper">
                          <input 
                            type="text" 
                            placeholder="Add a reply..." 
                            value={replyingTo.text}
                            onChange={(e) => setReplyingTo({ ...replyingTo, text: e.target.value })}
                            autoFocus
                          />
                          <div className="reply-btns">
                            <button onClick={() => setReplyingTo(null)}>Cancel</button>
                            <button onClick={() => handleComment(null, comment.id)}>Reply</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Replies */}
                  <div className="replies-container">
                    {comments.filter(c => c.parentId === comment.id).map(reply => (
                      <div key={reply.id} className="comment-item reply-item">
                        <img src={getAvatarUrl(reply.avatar)} alt={reply.username} className="comment-avatar small" />
                        <div className="comment-content">
                          <div className="comment-header">
                            <span className="comment-author">{reply.username}</span>
                            <span className="comment-date">{reply.timestamp}</span>
                          </div>
                          <p className="comment-text">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="related-videos-section">
        <h3>Related Videos</h3>
        <div className="related-grid">
          {relatedVideos.length > 0 ? (
            relatedVideos.map((v, index) => (
              <VideoCard key={`${v.id}-related-${index}`} video={v} />
            ))
          ) : (
            <p className="empty-message">No related videos found.</p>
          )}
        </div>
      </div>
      
      {showPlaylistModal && user && (
        <PlaylistModal 
          videoId={id} 
          userId={user.id} 
          onClose={() => setShowPlaylistModal(false)} 
        />
      )}

      {showEditModal && user?.id === video.userId && (
        <EditVideoModal
          video={video}
          userId={user.id}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updatedVideo) => {
            setVideo((prev) => ({ ...prev, ...updatedVideo }))
            setRelatedVideos((prev) => prev.map((item) => (item.id === updatedVideo.id ? { ...item, ...updatedVideo } : item)))
          }}
        />
      )}
    </div>
  )
}

export default VideoDetail
