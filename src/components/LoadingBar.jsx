import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './LoadingBar.css'

const LoadingBar = () => {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const location = useLocation()

  useEffect(() => {
    // Trigger loading state on location change
    setLoading(true)
    setProgress(30)

    const timer = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 300)
    }, 500)

    return () => clearTimeout(timer)
  }, [location])

  if (!loading) return null

  return (
    <div className="loading-bar-container">
      <div 
        className="loading-bar-fill" 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  )
}

export default LoadingBar
