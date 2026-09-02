import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('shows the public service search', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /find the people/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: /search services/i }),
    ).toBeInTheDocument()
  })
})
