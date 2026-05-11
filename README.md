# ▶️ Clicktube

Clicktube is a professional-grade video sharing platform built with the MERN stack. Inspired by YouTube, it features a sleek, responsive design with a high-performance backend and advanced content discovery tools.

## 🚀 Technical Stack

- **Frontend:** React 18, Vite, Lucide Icons, React Helmet Async (SEO).
- **Styling:** Premium Glassmorphism UI using Vanilla CSS (Flexbox & Grid).
- **Backend:** Node.js, Express.
- **Database:** MongoDB with Mongoose (formerly JSON-based).
- **Security:** Helmet, Express Rate Limit, Mongo Sanitize, JWT Authentication.
- **Media Handling:** Cloudinary integration for video and thumbnail storage.

## ✨ Core Features

- **Production-Ready Security:** Full protection against common web vulnerabilities and brute-force attacks.
- **Dynamic Content Discovery:**
  - **Search Autocomplete:** Real-time suggestions as you type.
  - **Explore Categories:** Dedicated feeds for Music, Gaming, and Sports.
  - **Infinite Scroll:** High-performance video feed with paginated loading.
- **Advanced UX:**
  - **Skeleton Loaders:** Professional loading states for a smoother feel.
  - **Toast Notifications:** Modern feedback using `react-hot-toast`.
- **Global Moderation:** Dedicated Admin Dashboard for global content management.
- **SEO Optimized:** Dynamic Open Graph tags for rich social media previews.

## 🛠️ Modernization Highlights

This project underwent a comprehensive technical audit and modernization, including:
1. **Database Migration:** Fully transitioned from a legacy JSON file system to a robust MongoDB architecture.
2. **API Centralization:** Refactored the entire networking layer to use a centralized service with JWT interceptors.
3. **Frontend Refactoring:** Standardized all components to use a consistent design system and loading patterns.
4. **Security Hardening:** Implemented industry-standard middlewares to protect user data and server integrity.

## ⚙️ Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ryuclover/Clicktube.git
   ```

2. **Backend Configuration:**
   - Go to `server/` directory.
   - Rename `.env.example` to `.env`.
   - Fill in your MongoDB URI, Cloudinary keys, and JWT Secret.
   ```bash
   npm install
   npm start
   ```

3. **Frontend Configuration:**
   - Go to the root directory.
   ```bash
   npm install
   npm run dev
   ```

## 🌐 Deployment
The platform is optimized for **Vercel** (Frontend) and **Render/Railway** (Backend). Ensure all Environment Variables are correctly set in your deployment dashboard.

---
*Clicktube is now optimized, secured, and ready for public use.*
