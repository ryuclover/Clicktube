import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw, RotateCw, PictureInPicture2 } from 'lucide-react'
import './CustomPlayer.css'

const CustomPlayer = ({ src, thumbnail, totalDuration }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [selectedQuality, setSelectedQuality] = useState('auto')
  const [currentSrc, setCurrentSrc] = useState(src)
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const settingsRef = useRef(null)
  const controlsTimeout = useRef(null)
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

  useEffect(() => {
    setIsPlaying(false)
    setProgress(0)
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

  useEffect(() => {
    const onClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

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

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    const current = videoRef.current.currentTime
    const total = videoRef.current.duration
    setCurrentTime(current)
    setDuration(total || 0)
    setProgress(total ? (current / total) * 100 : 0)
  }

  const handleProgressChange = (e) => {
    const newProgress = e.target.value
    const total = videoRef.current.duration
    videoRef.current.currentTime = (newProgress / 100) * total
    setProgress(newProgress)
  }

  const toggleMute = () => {
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    const metadataDuration = Number.isFinite(videoRef.current.duration) ? videoRef.current.duration : 0
    setDuration(metadataDuration)
    videoRef.current.playbackRate = playbackRate
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
      playerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
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

  const skip = (seconds) => {
    videoRef.current.currentTime += seconds
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore keyboard shortcuts if the user is typing in an input, textarea or contenteditable element
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

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'KeyM') {
        toggleMute()
      } else if (e.code === 'Period') {
        const nextRate = Math.min(2, Number((playbackRate + 0.25).toFixed(2)))
        handlePlaybackRateChange(nextRate)
      } else if (e.code === 'Comma') {
        const nextRate = Math.max(0.5, Number((playbackRate - 0.25).toFixed(2)))
        handlePlaybackRateChange(nextRate)
      } else if (e.code === 'ArrowRight') {
        skip(5)
      } else if (e.code === 'ArrowLeft') {
        skip(-5)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMuted, playbackRate])

  const handleMouseMove = () => {
    setShowControls(true)
    clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  return (
    <div 
      className={`custom-player ${showControls ? 'show-controls' : 'hide-controls'}`} 
      ref={playerRef}
      onMouseMove={handleMouseMove}
    >
      <video 
        ref={videoRef}
        src={currentSrc}
        poster={thumbnail}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="player-overlay glass">
        <div className="progress-container">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress} 
            onChange={handleProgressChange}
            className="progress-bar"
          />
        </div>

        <div className="controls-main">
          <div className="controls-left">
            <button className="control-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            <button className="control-btn" onClick={() => skip(-10)}>
              <RotateCcw size={20} />
            </button>
            <button className="control-btn" onClick={() => skip(10)}>
              <RotateCw size={20} />
            </button>
            
            <div className="volume-container">
              <button className="control-btn" onClick={toggleMute}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={isMuted ? 0 : volume} 
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>

            <div className="time-display">{formatTime(currentTime)} / {formatTime(effectiveDuration)}</div>
          </div>

          <div className="controls-right">
            <div className="settings-wrapper" ref={settingsRef}>
              <button className="control-btn" onClick={() => setShowSettings((prev) => !prev)}>
                <Settings size={20} />
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
                        <span className="settings-disabled">Indisponivel para esta fonte</span>
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
                <PictureInPicture2 size={20} />
              </button>
            )}
            <button className="control-btn" onClick={toggleFullScreen}>
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomPlayer
