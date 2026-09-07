import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import LoadingBar from './components/LoadingBar'
import ProtectedRoute from './components/ProtectedRoute'
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
            <Route path="/category/:categoryName" element={<CategoryResults />} />
            <Route path="/channel/:id" element={<ChannelDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/diagnostics" element={<Diagnostics />} />

            {/* Protected routes */}
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
            <Route path="/liked" element={<ProtectedRoute><Liked /></ProtectedRoute>} />
            <Route path="/playlist/:id" element={<ProtectedRoute><PlaylistDetail /></ProtectedRoute>} />
            <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
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
