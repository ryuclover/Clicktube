import React, { Suspense, lazy, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import LoadingBar from './components/LoadingBar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthContext } from './context/AuthContext'
import Home from './pages/Home'
import Trending from './pages/Trending'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import './App.css'

// P1: code-split heavy routes — keeps initial bundle small
const VideoDetail = lazy(() => import('./pages/VideoDetail'))
const SearchResults = lazy(() => import('./pages/SearchResults'))
const ChannelDetail = lazy(() => import('./pages/ChannelDetail'))
const CategoryResults = lazy(() => import('./pages/CategoryResults'))
const Upload = lazy(() => import('./pages/Upload'))
const Profile = lazy(() => import('./pages/Profile'))
const History = lazy(() => import('./pages/History'))
const Subscriptions = lazy(() => import('./pages/Subscriptions'))
const Studio = lazy(() => import('./pages/Studio'))
const Library = lazy(() => import('./pages/Library'))
const Liked = lazy(() => import('./pages/Liked'))
const PlaylistDetail = lazy(() => import('./pages/PlaylistDetail'))
const Admin = lazy(() => import('./pages/Admin'))
const Diagnostics = lazy(() => import('./pages/Diagnostics'))

const RouteFallback = () => (
  <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>Loading…</div>
)

// P3: diagnostics exposes backend internals — admin only in production
const AdminDiagnostics = () => {
  const { user } = useContext(AuthContext)
  if (import.meta.env.PROD && (!user || user.role !== 'admin')) {
    return <Navigate to="/" replace />
  }
  return <Diagnostics />
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <LoadingBar />
      <div className="app-container">
        <Navbar />
        <Sidebar />
        <main className="main-content">
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/video/:id" element={<VideoDetail />} />
            <Route path="/search/:searchTerm" element={<SearchResults />} />
            <Route path="/search" element={<Navigate to="/" replace />} />
            <Route path="/category/:categoryName" element={<CategoryResults />} />
            <Route path="/channel/:id" element={<ChannelDetail />} />
            <Route path="/library" element={<Library />} />
            <Route path="/history" element={<History />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/liked" element={<Liked />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/diagnostics" element={<AdminDiagnostics />} />

            {/* Protected routes */}
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/playlist/:id" element={<ProtectedRoute><PlaylistDetail /></ProtectedRoute>} />
            <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </main>
        <BottomNav />
      </div>
    </Router>
  )
}

export default App
