import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  RotateCcw, 
  RotateCw, 
  PictureInPicture2,
  Loader2
} from 'lucide-react'
import './CustomPlayer.css'

const CustomPlayer = ({ src, thumbnail, totalDuration }) => {
  // Volume & Mute persistence from localStorage
  const getInitialVolume = () => {
    try {
      const saved = localStorage.getItem('clicktube_volume')
      return saved !== null ? Math.min(1, Math.max(0, parseFloat(saved))) : 1
    } catch {
      return 1
    }
  }

  const getInitialMuted = () => {
    try {
      return localStorage.getItem('clicktube_muted') === 'true'
    } catch {
      return false
    }
  }

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [bufferedPercent, setBufferedPercent] = useState(0)
  const [isBuffering, setIsBuffering] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(getInitialMuted)
  const [volume, setVolume] = useState(getInitialVolume)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [selectedQuality, setSelectedQuality] = useState('auto')
  const [currentSrc, setCurrentSrc] = useState(src)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [tooltip, setTooltip] = useState({ visible: false, text: '00:00', x: 0 })
  const [feedback, setFeedback] = useState(null)

  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const settingsRef = useRef(null)
  const controlsTimeout = useRef(null)
  const feedbackTimeout = useRef(null)
  const clickTimeoutRef = useRef(null)
  const restorePlaybackRef = useRef(null)

  const isCloudinarySource = typeof src === 'string' && src.includes('/upload/')

  const qualityOptions = [
    { value: 'auto', label: 'Auto' },
    { value: 'q_auto:best', label: 'Alta' },
    { value: 'q_auto:eco', label: 'Media' },
    { value: 'q_auto:low', label: 'Baixa' }
  ]

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2]

  const parseDurationToSeconds = (durationValue) => {
    if (typeof durationValue !== 'string') return 0
    const parts = durationValue.split(':').map((part) => Number(part))
    if (parts.some((part) => !Number.isFinite(part))) return 0
    if (parts.length === 2) {
      return (parts[0] * 60) + parts[1]
    }
    if (parts.length === 3) {
      return (parts[0] * 3600) + (parts[1] * 60) + parts[2]
    }
    return 0
  }

  const fallbackDuration = parseDurationToSeconds(totalDuration)
  const effectiveDuration = Number.isFinite(duration) && duration > 0 ? duration : fallbackDuration

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '00:00'
    const total = Math.max(0, Math.floor(seconds))
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const secs = total % 60

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const buildQualitySrc = (sourceUrl, qualityValue) => {
    if (!sourceUrl || !sourceUrl.includes('/upload/') || qualityValue === 'auto') {
      return sourceUrl
    }
    return sourceUrl.replace('/upload/', `/upload/${qualityValue}/`)
  }

  // Trigger brief visual feedback in center of video
  const triggerFeedback = useCallback((type, label) => {
    setFeedback({ type, label, key: Date.now() })
    clearTimeout(feedbackTimeout.current)
    feedbackTimeout.current = setTimeout(() => {
      setFeedback(null)
    }, 600)
  }, [])

  // Sync initial volume and mute preferences on video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      videoRef.current.muted = isMuted
    }
  }, [])

  // Reset and warm buffer when src changes
  useEffect(() => {
    setIsPlaying(false)
    setProgress(0)
    setBufferedPercent(0)
    setCurrentTime(0)
    setDuration(0)
    setShowSettings(false)
    setPlaybackRate(1)
    setSelectedQuality('auto')
    setCurrentSrc(src)
    if (videoRef.current) {
      videoRef.current.load()
    }
  }, [src])

  // Track Fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Close settings popup when clicking outside
  useEffect(() => {
    const onClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Preserve state during quality switches
  useEffect(() => {
    const video = videoRef.current
    const restore = restorePlaybackRef.current
    if (!video || !restore) return

    const restorePlayback = () => {
      if (Number.isFinite(restore.time)) {
        video.currentTime = Math.min(restore.time, Number.isFinite(video.duration) ? video.duration : restore.time)
      }
      video.playbackRate = restore.rate
      if (restore.wasPlaying) {
        video.play().catch(() => {})
      }
      restorePlaybackRef.current = null
    }

    video.addEventListener('loadedmetadata', restorePlayback, { once: true })
  }, [currentSrc])

  const togglePlayWithFeedback = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true)
        triggerFeedback('play')
      }).catch(() => {})
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
      triggerFeedback('pause')
    }
  }, [triggerFeedback])

  const togglePlay = () => {
    togglePlayWithFeedback()
  }

  const updateBufferProgress = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.duration) return
    const buffered = video.buffered
    if (buffered.length > 0) {
      const current = video.currentTime
      let end = 0
      for (let i = 0; i < buffered.length; i++) {
        if (buffered.start(i) <= current && current <= buffered.end(i)) {
          end = buffered.end(i)
          break
        }
        if (buffered.end(i) > end) {
          end = buffered.end(i)
        }
      }
      setBufferedPercent(Math.min(100, (end / video.duration) * 100))
    }
  }, [])

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    const current = video.currentTime
    const total = video.duration
    setCurrentTime(current)
    setDuration(total || 0)
    setProgress(total ? (current / total) * 100 : 0)
    updateBufferProgress()
  }

  const handleProgressChange = (e) => {
    const newProgress = parseFloat(e.target.value)
    const total = videoRef.current.duration || fallbackDuration
    if (total) {
      videoRef.current.currentTime = (newProgress / 100) * total
    }
    setProgress(newProgress)
  }

  const handleProgressMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const hoverSeconds = pos * effectiveDuration
    setTooltip({
      visible: true,
      text: formatTime(hoverSeconds),
      x: e.clientX - rect.left
    })
  }

  const handleProgressMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    const nextMuted = !isMuted
    videoRef.current.muted = nextMuted
    setIsMuted(nextMuted)
    try {
      localStorage.setItem('clicktube_muted', String(nextMuted))
    } catch {}
  }, [isMuted])

  const changeVolume = useCallback((newVolume) => {
    if (!videoRef.current) return
    const clamped = Math.max(0, Math.min(1, Number(newVolume.toFixed(2))))
    videoRef.current.volume = clamped
    setVolume(clamped)
    const muted = clamped === 0
    videoRef.current.muted = muted
    setIsMuted(muted)
    try {
      localStorage.setItem('clicktube_volume', String(clamped))
      localStorage.setItem('clicktube_muted', String(muted))
    } catch {}
  }, [])

  const handleVolumeChange = (e) => {
    changeVolume(parseFloat(e.target.value))
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    const metadataDuration = Number.isFinite(videoRef.current.duration) ? videoRef.current.duration : 0
    setDuration(metadataDuration)
    videoRef.current.playbackRate = playbackRate
    updateBufferProgress()
  }

  const handlePlaybackRateChange = (rate) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = rate
    setPlaybackRate(rate)
  }

  const handleQualityChange = (qualityValue) => {
    setSelectedQuality(qualityValue)
    if (!videoRef.current || !isCloudinarySource) return

    const nextSrc = buildQualitySrc(src, qualityValue)
    if (!nextSrc || nextSrc === currentSrc) return

    restorePlaybackRef.current = {
      time: videoRef.current.currentTime,
      rate: playbackRate,
      wasPlaying: !videoRef.current.paused
    }
    setCurrentSrc(nextSrc)
  }

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const togglePictureInPicture = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (videoRef.current && document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture()
      }
    } catch (err) {
      console.error('Picture-in-picture error', err)
    }
  }

  const skip = useCallback((seconds) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 99999, videoRef.current.currentTime + seconds))
  }, [])

  // Handle single click (play/pause) vs double click (seek -10s / +10s)
  const handlePlayerClick = (e) => {
    if (e.target.closest('.player-overlay') || e.target.closest('.control-btn')) return

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null

      const rect = playerRef.current?.getBoundingClientRect()
      if (!rect) return
      const clickX = e.clientX - rect.left
      const isLeft = clickX < rect.width / 2

      if (isLeft) {
        skip(-10)
        triggerFeedback('rewind', '-10s')
      } else {
        skip(10)
        triggerFeedback('forward', '+10s')
      }
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null
        togglePlayWithFeedback()
      }, 240)
    }
  }

  // Keyboard shortcuts (YouTube style: Space, K, J, L, F, M, Arrows, 0-9)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement
      if (
        activeEl && (
          activeEl.tagName === 'INPUT' || 
          activeEl.tagName === 'TEXTAREA' || 
          activeEl.isContentEditable
        )
      ) {
        return
      }

      if (e.code === 'Space' || e.code === 'KeyK') {
        e.preventDefault()
        togglePlayWithFeedback()
      } else if (e.code === 'KeyM') {
        toggleMute()
      } else if (e.code === 'KeyF') {
        toggleFullScreen()
      } else if (e.code === 'KeyJ') {
        skip(-10)
        triggerFeedback('rewind', '-10s')
      } else if (e.code === 'KeyL') {
        skip(10)
        triggerFeedback('forward', '+10s')
      } else if (e.code === 'Period') {
        const nextRate = Math.min(2, Number((playbackRate + 0.25).toFixed(2)))
        handlePlaybackRateChange(nextRate)
      } else if (e.code === 'Comma') {
        const nextRate = Math.max(0.5, Number((playbackRate - 0.25).toFixed(2)))
        handlePlaybackRateChange(nextRate)
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        skip(5)
        triggerFeedback('forward', '+5s')
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        skip(-5)
        triggerFeedback('rewind', '-5s')
      } else if (e.code === 'ArrowUp') {
        e.preventDefault()
        changeVolume(Math.min(1, volume + 0.05))
      } else if (e.code === 'ArrowDown') {
        e.preventDefault()
        changeVolume(Math.max(0, volume - 0.05))
      } else if (e.code.startsWith('Digit')) {
        const digit = parseInt(e.code.replace('Digit', ''), 10)
        if (!Number.isNaN(digit) && effectiveDuration > 0) {
          const targetTime = (digit / 10) * effectiveDuration
          videoRef.current.currentTime = targetTime
          setCurrentTime(targetTime)
          setProgress(digit * 10)
          triggerFeedback('seek', `${digit * 10}%`)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isMuted, 
    playbackRate, 
    volume, 
    effectiveDuration, 
    togglePlayWithFeedback, 
    toggleMute, 
    changeVolume, 
    skip, 
    triggerFeedback
  ])

  const handleMouseMove = () => {
    setShowControls(true)
    clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 2800)
  }

  return (
    <div 
      className={`custom-player ${showControls ? 'show-controls' : 'hide-controls'}`} 
      ref={playerRef}
      onMouseMove={handleMouseMove}
      onClick={handlePlayerClick}
    >
      <video 
        ref={videoRef}
        src={currentSrc}
        poster={thumbnail}
        preload="auto"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onProgress={updateBufferProgress}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => {
          setIsBuffering(false)
          updateBufferProgress()
        }}
        onPlaying={() => setIsBuffering(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Center Buffering Spinner */}
      {isBuffering && (
        <div className="player-buffering">
          <Loader2 className="spinner-icon" size={48} />
        </div>
      )}

      {/* Tactile Center Feedback (Play, Pause, Skip ±10s) */}
      {feedback && (
        <div key={feedback.key} className="center-feedback">
          {feedback.type === 'play' && <Play size={36} fill="white" />}
          {feedback.type === 'pause' && <Pause size={36} fill="white" />}
          {feedback.type === 'rewind' && <div className="feedback-label">« {feedback.label}</div>}
          {feedback.type === 'forward' && <div className="feedback-label">{feedback.label} »</div>}
          {feedback.type === 'seek' && <div className="feedback-label">{feedback.label}</div>}
        </div>
      )}

      <div className="player-overlay glass">
        {/* Progress bar container with buffer and hover preview */}
        <div 
          className="progress-container"
          onMouseMove={handleProgressMouseMove}
          onMouseLeave={handleProgressMouseLeave}
        >
          {tooltip.visible && (
            <div 
              className="time-tooltip" 
              style={{ left: `${tooltip.x}px` }}
            >
              {tooltip.text}
            </div>
          )}
          <div 
            className="progress-buffer" 
            style={{ width: `${bufferedPercent}%` }} 
          />
          <div 
            className="progress-played" 
            style={{ width: `${progress}%` }} 
          />
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="0.1"
            value={progress} 
            onChange={handleProgressChange}
            className="progress-bar"
            aria-label="Seek slider"
          />
        </div>

        <div className="controls-main">
          <div className="controls-left">
            <button className="control-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            </button>
            <button className="control-btn" onClick={() => { skip(-10); triggerFeedback('rewind', '-10s'); }} title="Voltar 10s (J)" aria-label="Voltar 10 segundos">
              <RotateCcw size={18} />
            </button>
            <button className="control-btn" onClick={() => { skip(10); triggerFeedback('forward', '+10s'); }} title="Avançar 10s (L)" aria-label="Avançar 10 segundos">
              <RotateCw size={18} />
            </button>
            
            <div className="volume-container">
              <button className="control-btn" onClick={toggleMute} title="Mudo (M)" aria-label="Alternar som">
                {isMuted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.02" 
                value={isMuted ? 0 : volume} 
                onChange={handleVolumeChange}
                className="volume-slider"
                aria-label="Volume slider"
              />
            </div>

            <div className="time-display">{formatTime(currentTime)} / {formatTime(effectiveDuration)}</div>
          </div>

          <div className="controls-right">
            <div className="settings-wrapper" ref={settingsRef}>
              <button 
                className="control-btn" 
                onClick={() => setShowSettings((prev) => !prev)}
                title="Configurações"
                aria-label="Configurações do vídeo"
              >
                <Settings size={19} />
              </button>

              {showSettings && (
                <div className="settings-menu glass">
                  <div className="settings-section">
                    <p className="settings-title">Velocidade</p>
                    <div className="settings-list">
                      {speedOptions.map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          className={`settings-item ${playbackRate === speed ? 'active' : ''}`}
                          onClick={() => handlePlaybackRateChange(speed)}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="settings-section">
                    <p className="settings-title">Qualidade</p>
                    <div className="settings-list">
                      {isCloudinarySource ? qualityOptions.map((quality) => (
                        <button
                          key={quality.value}
                          type="button"
                          className={`settings-item ${selectedQuality === quality.value ? 'active' : ''}`}
                          onClick={() => handleQualityChange(quality.value)}
                        >
                          {quality.label}
                        </button>
                      )) : (
                        <span className="settings-disabled">Indisponível para esta fonte</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {typeof document !== 'undefined' && document.pictureInPictureEnabled && (
              <button 
                type="button"
                className="control-btn" 
                onClick={togglePictureInPicture} 
                title="Picture-in-Picture"
                aria-label="Picture-in-Picture"
              >
                <PictureInPicture2 size={19} />
              </button>
            )}

            <button className="control-btn" onClick={toggleFullScreen} title="Tela cheia (F)" aria-label="Tela cheia">
              {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomPlayer
