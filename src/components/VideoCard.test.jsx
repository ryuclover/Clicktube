import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import VideoCard from './VideoCard'
import { describe, it, expect } from 'vitest'

describe('VideoCard', () => {
  const mockVideo = {
    id: '123',
    title: 'Test Video',
    thumbnail: 'test.jpg',
    channel: 'Test Channel',
    viewsCount: 1000,
    timestamp: '1 day ago'
  }

  it('renders video title and channel name', () => {
    render(
      <BrowserRouter>
        <VideoCard video={mockVideo} />
      </BrowserRouter>
    )

    expect(screen.getByText('Test Video')).toBeInTheDocument()
    expect(screen.getByText('Test Channel')).toBeInTheDocument()
  })

  it('renders video metadata', () => {
    render(
      <BrowserRouter>
        <VideoCard video={mockVideo} />
      </BrowserRouter>
    )

    expect(screen.getByText('1K views', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('1 day ago', { exact: false })).toBeInTheDocument()
  })
})
