import React, { useState, useEffect } from 'react'
import api from '../api/api'
import config from '../config'
import './Diagnostics.css'

const Diagnostics = () => {
  const [apiStatus, setApiStatus] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await api.get('/videos', { params: { limit: 1 } })
        setApiStatus({ status: 'OK', statusCode: 200, message: 'Backend is reachable' })
      } catch (error) {
        setApiStatus({
          status: 'ERROR',
          statusCode: error.response?.status || 'Network Error',
          message: error.response?.data?.message || error.message
        })
      }
    }
    checkBackend()
  }, [])

  const handleTestUpload = async () => {
    setUploading(true)
    setTestResult(null)

    try {
      // Criar um vídeo teste mínimo (1 segundo de áudio silencioso)
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 240
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, 320, 240)

      const stream = canvas.captureStream(30)
      const mediaRecorder = new MediaRecorder(stream)
      const chunks = []

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const formData = new FormData()
        formData.append('title', `Test Upload ${Date.now()}`)
        formData.append('description', 'Diagnostic test')
        formData.append('category', 'Gaming')
        formData.append('status', 'draft')
        formData.append('video', blob, 'test.webm')

        try {
          await api.post('/videos/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          setTestResult({ success: true, message: 'Test upload succeeded!' })
        } catch (error) {
          setTestResult({
            success: false,
            statusCode: error.response?.status,
            message: error.response?.data?.message || error.message,
            fullError: error.response?.data
          })
        }
      }

      mediaRecorder.start()
      setTimeout(() => mediaRecorder.stop(), 1000)
    } catch (error) {
      setTestResult({ success: false, message: error.message })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#1a1a1a', color: '#00ff00', minHeight: '100vh' }}>
      <h1>🔧 Clicktube Diagnostics</h1>

      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #00ff00', borderRadius: '5px' }}>
        <h2>Environment Info</h2>
        <p><strong>VITE_API_URL:</strong> {config.apiUrl}</p>
        <p><strong>Frontend URL:</strong> {window.location.origin}</p>
        <p><strong>Token (from storage):</strong> {sessionStorage.getItem('token') ? '✓ Present' : '✗ Missing'}</p>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #00ff00', borderRadius: '5px' }}>
        <h2>Backend Connection</h2>
        {apiStatus ? (
          <>
            <p><strong>Status:</strong> {apiStatus.status}</p>
            <p><strong>Code:</strong> {apiStatus.statusCode}</p>
            <p><strong>Message:</strong> {apiStatus.message}</p>
          </>
        ) : (
          <p>Checking...</p>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #00ff00', borderRadius: '5px' }}>
        <h2>Upload Test</h2>
        <button
          onClick={handleTestUpload}
          disabled={uploading || !sessionStorage.getItem('token')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#00ff00',
            color: '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {uploading ? 'Testing...' : 'Run Upload Test'}
        </button>
        {!sessionStorage.getItem('token') && <p style={{ color: '#ff6600' }}>⚠️ Login first to test upload</p>}
        {testResult && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: testResult.success ? '#002200' : '#220000', borderRadius: '5px' }}>
            <p><strong>Result:</strong> {testResult.success ? '✓ Success' : '✗ Failed'}</p>
            <p><strong>Message:</strong> {testResult.message}</p>
            {testResult.statusCode && <p><strong>HTTP Status:</strong> {testResult.statusCode}</p>}
            {testResult.fullError && <pre>{JSON.stringify(testResult.fullError, null, 2)}</pre>}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ff6600', borderRadius: '5px' }}>
        <h2>🔍 Troubleshooting Tips</h2>
        <ul>
          <li>If VITE_API_URL is wrong, update it in Vercel dashboard → Environment Variables</li>
          <li>If "token missing", login first before testing upload</li>
          <li>Check browser DevTools (Network tab) for actual request/response</li>
          <li>Backend logs: https://dashboard.render.com/</li>
        </ul>
      </div>
    </div>
  )
}

export default Diagnostics
