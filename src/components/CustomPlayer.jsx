import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw, RotateCw } from 'lucide-react'
import './CustomPlayer.css'

const CustomPlayer = ({ src, thumbnail }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const controlsTimeout = useRef(null)

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
    setProgress((current / total) * 100)
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

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const skip = (seconds) => {
    videoRef.current.currentTime += seconds
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'KeyM') {
        toggleMute()
      } else if (e.code === 'ArrowRight') {
        skip(5)
      } else if (e.code === 'ArrowLeft') {
        skip(-5)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMuted])

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
        src={src}
        poster={thumbnail}
        onTimeUpdate={handleTimeUpdate}
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
          </div>

          <div className="controls-right">
            <button className="control-btn">
              <Settings size={20} />
            </button>
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
