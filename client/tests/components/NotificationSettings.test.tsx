// NotificationSettings Component Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationSettings from '../../src/components/NotificationSettings';
import { pushService } from '../../src/services/push';

// Mock the push service
vi.mock('../../src/services/push', () => ({
  pushService: {
    isSupported: vi.fn(),
    init: vi.fn(),
    getStatus: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    sendTest: vi.fn()
  }
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'notifications.pushNotifications': 'Push Notifications',
        'notifications.browserNotSupported':
          'Your browser does not support push notifications',
        'notifications.permissionDenied':
          'You have blocked notifications. Enable them in browser settings.',
        'notifications.permissionGranted': 'Notifications enabled',
        'notifications.testNotification': 'Send test notification'
      };
      return translations[key] || key;
    }
  })
}));

describe('NotificationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show not supported message when push is not available', async () => {
    vi.mocked(pushService.isSupported).mockReturnValue(false);

    render(<NotificationSettings />);

    await waitFor(() => {
      expect(screen.getByText(/does not support push/i)).toBeInTheDocument();
    });
  });

  it('should show blocked message when permission is denied', async () => {
    vi.mocked(pushService.isSupported).mockReturnValue(true);
    vi.mocked(pushService.init).mockResolvedValue(true);
    vi.mocked(pushService.getStatus).mockResolvedValue({
      subscribed: false,
      permission: 'denied'
    });

    render(<NotificationSettings />);

    await waitFor(() => {
      expect(screen.getByText(/blocked notifications/i)).toBeInTheDocument();
    });
  });

  it('should show toggle when notifications are available', async () => {
    vi.mocked(pushService.isSupported).mockReturnValue(true);
    vi.mocked(pushService.init).mockResolvedValue(true);
    vi.mocked(pushService.getStatus).mockResolvedValue({
      subscribed: false,
      permission: 'default'
    });

    render(<NotificationSettings />);

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });
  });

  it('should subscribe when toggle is clicked', async () => {
    vi.mocked(pushService.isSupported).mockReturnValue(true);
    vi.mocked(pushService.init).mockResolvedValue(true);
    vi.mocked(pushService.getStatus).mockResolvedValue({
      subscribed: false,
      permission: 'default'
    });
    vi.mocked(pushService.subscribe).mockResolvedValue(true);

    render(<NotificationSettings />);

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('switch'));

    await waitFor(() => {
      expect(pushService.subscribe).toHaveBeenCalled();
    });
  });

  it('should unsubscribe when already subscribed', async () => {
    vi.mocked(pushService.isSupported).mockReturnValue(true);
    vi.mocked(pushService.init).mockResolvedValue(true);
    vi.mocked(pushService.getStatus).mockResolvedValue({
      subscribed: true,
      permission: 'granted'
    });
    vi.mocked(pushService.unsubscribe).mockResolvedValue(true);

    render(<NotificationSettings />);

    await waitFor(() => {
      expect(screen.getByText(/test notification/i)).toBeInTheDocument();
    });

    // Click the toggle switch
    fireEvent.click(screen.getByRole('switch'));

    await waitFor(() => {
      expect(pushService.unsubscribe).toHaveBeenCalled();
    });
  });

  it('should send test notification when button is clicked', async () => {
    vi.mocked(pushService.isSupported).mockReturnValue(true);
    vi.mocked(pushService.init).mockResolvedValue(true);
    vi.mocked(pushService.getStatus).mockResolvedValue({
      subscribed: true,
      permission: 'granted'
    });
    vi.mocked(pushService.sendTest).mockResolvedValue(true);

    render(<NotificationSettings />);

    await waitFor(() => {
      expect(screen.getByText(/test notification/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/test notification/i));

    await waitFor(() => {
      expect(pushService.sendTest).toHaveBeenCalled();
    });
  });
});
