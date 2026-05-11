import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/api'
import { AuthContext } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'
import './Auth.css'

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isLoading) return
    setIsLoading(true)
    const loadingToast = toast.loading('Creating account...')
    try {
      const res = await api.post('/auth/register', { username, email, password })
      login(res.data.user, res.data.token)
      toast.success('Account created successfully!', { id: loadingToast })
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed', { id: loadingToast })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container fade-in">
      <form className="auth-form glass" onSubmit={handleSubmit}>
        <h2>Join Clicktube</h2>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isLoading} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
        <input type="password" placeholder="Password (min. 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
        <button type="submit" className="auth-btn" disabled={isLoading}>
          {isLoading ? <Loader2 size={18} className="spin" /> : 'Register'}
        </button>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  )
}

export default Register
