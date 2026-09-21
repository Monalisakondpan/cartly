import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SessionIndicator from './SessionIndicator'

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
}))

import { useQuery } from '@apollo/client/react'

describe('SessionIndicator', () => {
  it('renders nothing when there is no user data', () => {
    vi.mocked(useQuery).mockReturnValue({ data: undefined } as any)

    const { container } = render(<SessionIndicator token="fake-token" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the name and "Seller" label for an owner', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { me: { email: 'owner@test.com', role: 'owner', name: 'Jane Doe' } },
    } as any)

    render(<SessionIndicator token="fake-token" />)
    expect(screen.getByText('Jane Doe (Seller)')).toBeInTheDocument()
  })

  it('falls back to email when name is null', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { me: { email: 'owner@test.com', role: 'owner', name: null } },
    } as any)

    render(<SessionIndicator token="fake-token" />)
    expect(screen.getByText('owner@test.com (Seller)')).toBeInTheDocument()
  })

  it('shows "Customer" label for a customer role', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { me: { email: 'buyer@test.com', role: 'customer', name: 'John Buyer' } },
    } as any)

    render(<SessionIndicator token="fake-token" />)
    expect(screen.getByText('John Buyer (Customer)')).toBeInTheDocument()
  })

  it('shows "Admin" label for an admin role', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { me: { email: 'admin@test.com', role: 'admin', name: null } },
    } as any)

    render(<SessionIndicator token="fake-token" />)
    expect(screen.getByText('admin@test.com (Admin)')).toBeInTheDocument()
  })
})