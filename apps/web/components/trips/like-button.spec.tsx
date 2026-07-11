import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LikeButton } from './like-button';
import { useAuth } from '@clerk/nextjs';
import { likeTrip, unlikeTrip } from '@/lib/trip-api';

vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/trip-api', () => ({
  likeTrip: vi.fn(),
  unlikeTrip: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedLikeTrip = vi.mocked(likeTrip);
const mockedUnlikeTrip = vi.mocked(unlikeTrip);

describe('LikeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a disabled button with the initial count while auth is loading', () => {
    mockedUseAuth.mockReturnValue({ isLoaded: false } as ReturnType<typeof useAuth>);

    render(<LikeButton tripId="trip-1" initialLiked={false} initialCount={5} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('5');
  });

  it('renders a sign-in prompt when the user is signed out', () => {
    mockedUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: false } as ReturnType<typeof useAuth>);

    render(<LikeButton tripId="trip-1" initialLiked={false} initialCount={3} />);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent('3');
    expect(mockedLikeTrip).not.toHaveBeenCalled();
  });

  it('optimistically increments and calls likeTrip when toggled on', async () => {
    const getToken = vi.fn().mockResolvedValue('token-123');
    mockedUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true, getToken } as unknown as ReturnType<
      typeof useAuth
    >);
    mockedLikeTrip.mockResolvedValue({ liked: true });

    render(<LikeButton tripId="trip-1" initialLiked={false} initialCount={3} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('4');

    await waitFor(() => expect(mockedLikeTrip).toHaveBeenCalledWith('token-123', 'trip-1'));
    expect(mockedUnlikeTrip).not.toHaveBeenCalled();
  });

  it('optimistically decrements and calls unlikeTrip when toggled off', async () => {
    const getToken = vi.fn().mockResolvedValue('token-123');
    mockedUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true, getToken } as unknown as ReturnType<
      typeof useAuth
    >);
    mockedUnlikeTrip.mockResolvedValue({ liked: false });

    render(<LikeButton tripId="trip-1" initialLiked={true} initialCount={3} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('2');

    await waitFor(() => expect(mockedUnlikeTrip).toHaveBeenCalledWith('token-123', 'trip-1'));
  });

  it('reverts the optimistic update when the API call fails', async () => {
    const getToken = vi.fn().mockResolvedValue('token-123');
    mockedUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true, getToken } as unknown as ReturnType<
      typeof useAuth
    >);
    mockedLikeTrip.mockRejectedValue(new Error('network error'));

    render(<LikeButton tripId="trip-1" initialLiked={false} initialCount={3} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('4');

    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('3'));
  });
});
