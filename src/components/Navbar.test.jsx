import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import Navbar from './Navbar'
import { AuthContext } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'

const mockAuthValue = {
  user: null,
  logout: vi.fn(),
}

const mockThemeValue = {
  theme: 'dark',
  toggleTheme: vi.fn(),
}

const renderNavbar = (authValue = mockAuthValue, themeValue = mockThemeValue) => {
  return render(
    <BrowserRouter>
      <ThemeContext.Provider value={themeValue}>
        <AuthContext.Provider value={authValue}>
          <Navbar />
        </AuthContext.Provider>
      </ThemeContext.Provider>
    </BrowserRouter>
  )
}

describe('Navbar', () => {
  it('renders logo and search input', () => {
    renderNavbar()
    expect(screen.getByText('Clicktube')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search videos...')).toBeInTheDocument()
  })

  it('renders login button when user is not logged in', () => {
    renderNavbar()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('renders user menu when logged in', () => {
    renderNavbar({
      user: { id: '1', username: 'TestUser', avatar: 'test.jpg' },
      logout: vi.fn(),
    })
    
    // Login button should not be there
    expect(screen.queryByText('Log in')).not.toBeInTheDocument()
    
    // User avatar should be present
    expect(screen.getByAltText('TestUser')).toBeInTheDocument()
  })
})
