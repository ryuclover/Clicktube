import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import LoadingBar from './components/LoadingBar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import VideoDetail from './pages/VideoDetail'
import SearchResults from './pages/SearchResults'
import ChannelDetail from './pages/ChannelDetail'
import CategoryResults from './pages/CategoryResults'
import Login from './pages/Login'
import Register from './pages/Register'
import Upload from './pages/Upload'
import Profile from './pages/Profile'
import History from './pages/History'
import Subscriptions from './pages/Subscriptions'
import Studio from './pages/Studio'
import Trending from './pages/Trending'
import Library from './pages/Library'
import PlaylistDetail from './pages/PlaylistDetail'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'
import './App.css'

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <LoadingBar />
      <div className="app-container">
        <Navbar />
        <Sidebar />
        <main className="main-content">
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

            {/* Protected routes */}
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
            <Route path="/playlist/:id" element={<ProtectedRoute><PlaylistDetail /></ProtectedRoute>} />
            <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
            <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  )
}

export default App
