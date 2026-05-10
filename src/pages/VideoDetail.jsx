import React, { useState, useEffect, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import config from '../config'
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, CheckCircle, Send, FolderPlus } from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import { mockVideos } from '../utils/mockData'
import VideoCard from '../components/VideoCard'
import PlaylistModal from '../components/PlaylistModal'
import './VideoDetail.css'

const VideoDetail = () => {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  
  const [video, setVideo] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)

  useEffect(() => {
    const fetchVideoData = async () => {
      if (config.mode === 'mock') {
        setVideo(mockVideos.find(v => v.id === id) || mockVideos[0])
        return
      }

      try {
        const res = await axios.get(`${config.apiUrl}/videos`)
        const found = res.data.find(v => v.id === id) || mockVideos.find(v => v.id === id) || mockVideos[0]
        setVideo(found)
        
        // Track History
        if (user) {
          axios.post(`${config.apiUrl}/social/history`, { userId: user.id, videoId: id })
        }
        
        // Increment View
        axios.post(`${config.apiUrl}/videos/${id}/view`)

        const commentsRes = await axios.get(`${config.apiUrl}/social/comments/${id}`)
        setComments(commentsRes.data)
      } catch (err) {
        console.error('Error fetching video data', err)
      }
    }
    fetchVideoData()
  }, [id, user])

  const handleLike = async (type) => {
    if (!user) return alert('Please login to like')
    try {
      await axios.post(`${config.apiUrl}/social/like`, { videoId: id, userId: user.id, type })
      if (type === 'like') {
        setLiked(!liked)
        setDisliked(false)
      } else {
        setDisliked(!disliked)
        setLiked(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const [replyingTo, setReplyingTo] = useState(null)
  const [subscribed, setSubscribed] = useState(false)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)

  const handleSubscribe = async () => {
    if (!user) return alert('Please login to subscribe')
    try {
      const res = await axios.post(`${config.apiUrl}/social/subscribe`, { 
        userId: user.id, 
        channelId: video.userId 
      })
      setSubscribed(res.data.subscribed)
    } catch (err) {
      console.error(err)
    }
  }

  const handleComment = async (e, parentId = null) => {
    if (e) e.preventDefault()
    if (!user) return alert('Please login to comment')
    
    const text = parentId ? replyingTo.text : newComment
    if (!text.trim()) return

    try {
      const res = await axios.post(`${config.apiUrl}/social/comment`, {
        videoId: id,
        userId: user.id,
        text,
        parentId
      })
      setComments([res.data, ...comments])
      setNewComment('')
      setReplyingTo(null)
    } catch (err) {
      console.error(err)
    }
  }

  if (!video) return <div className="loading">Loading...</div>

  const videoUrl = video.url ? (video.url.startsWith('http') ? video.url : `http://localhost:5000${video.url}`) : '';

  return (
    <div className="video-detail-container fade-in">
      <div className="video-section">
        <div className="player-wrapper">
          {video.url && video.url.includes('youtube.com') ? (
             <iframe src={video.url.replace('watch?v=', 'embed/')} title={video.title} frameBorder="0" allowFullScreen></iframe>
          ) : (
            video.url ? <video src={videoUrl} controls autoPlay className="native-player"></video> : <div className="no-video">No video available</div>
          )}
        </div>
        
        <div className="video-info-section">
          <h1 className="video-title">{video.title}</h1>
          
          <div className="video-actions-bar">
            <div className="channel-info">
              <Link to={`/channel/${video.userId}`} className="channel-avatar">
                <img src={video.channelAvatar} alt={video.channel} />
              </Link>
              <div className="channel-text">
                <Link to={`/channel/${video.userId}`} className="channel-name">
                  {video.channel} <CheckCircle size={14} fill="#a1a1aa" color="var(--bg-color)" />
                </Link>
                <span className="sub-count">1.2M subscribers</span>
              </div>
              <button 
                className={`subscribe-btn ${subscribed ? 'subscribed' : ''}`}
                onClick={handleSubscribe}
              >
                {subscribed ? 'Subscribed' : 'Subscribe'}
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
                onClick={() => user ? setShowPlaylistModal(true) : alert('Please login to save videos')}
              >
                <FolderPlus size={18} /> Save
              </button>
              <button className="action-btn hide-tablet"><Download size={18} /> Download</button>
              <button className="action-btn"><MoreHorizontal size={18} /></button>
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
              <img src={user?.avatar || 'https://i.pravatar.cc/150'} alt="me" className="comment-avatar" />
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
                    <img src={comment.avatar} alt={comment.username} className="comment-avatar" />
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
                        <img src={reply.avatar} alt={reply.username} className="comment-avatar small" />
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
          {mockVideos.map((v, index) => (
            <VideoCard key={`${v.id}-related-${index}`} video={v} />
          ))}
        </div>
      </div>
      
      {showPlaylistModal && (
        <PlaylistModal 
          videoId={id} 
          userId={user.id} 
          onClose={() => setShowPlaylistModal(false)} 
        />
      )}
    </div>
  )
}

export default VideoDetail
