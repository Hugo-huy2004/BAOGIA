import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScheduledPush from '../models/ScheduledPush.js';
import InAppNotification from '../models/InAppNotification.js';
import Bio from '../models/Bio.js';
import NotificationSubscription from '../models/NotificationSubscription.js';
import { runScheduledCompanionPushes } from '../services/smartNotificationService.js';

vi.mock('../models/ScheduledPush.js', () => {
  return {
    default: {
      find: vi.fn(),
    }
  };
});

vi.mock('../models/InAppNotification.js', () => {
  return {
    default: {
      create: vi.fn(),
    }
  };
});

vi.mock('../models/Bio.js', () => {
  return {
    default: {
      findOne: vi.fn(),
      updateOne: vi.fn(),
    }
  };
});

vi.mock('../models/NotificationSubscription.js', () => {
  return {
    default: {
      find: vi.fn(),
    }
  };
});

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Tự động hóa & Thông báo thông minh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runScheduledCompanionPushes', () => {
    it('bỏ qua nếu không có thông báo lập lịch đến hạn', async () => {
      ScheduledPush.find.mockResolvedValue([]);

      await runScheduledCompanionPushes();

      expect(ScheduledPush.find).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('gửi push và tạo in-app notification khi có thông báo đến hạn', async () => {
      const mockPushItem = {
        email: 'user@test.vn',
        feature: 'breathing',
        label: 'Hít Thở 4-7-8',
        sent: false,
        save: vi.fn().mockResolvedValue(true)
      };

      ScheduledPush.find.mockResolvedValue([mockPushItem]);
      Bio.findOne.mockReturnValue({
        lean: () => ({ email: 'user@test.vn', displayName: 'Alice' })
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          should_send: true,
          title: '📍 Thử thách hít thở',
          body: 'Hãy dành 5 phút luyện tập hít thở 4-7-8 nhé!',
          url: '/member/companion'
        })
      });

      NotificationSubscription.find.mockResolvedValue([
        { subscription: { endpoint: 'https://updates.push.com/123' } }
      ]);

      await runScheduledCompanionPushes();

      expect(mockFetch).toHaveBeenCalled();
      expect(InAppNotification.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'user@test.vn',
        title: '📍 Thử thách hít thở',
        message: 'Hãy dành 5 phút luyện tập hít thở 4-7-8 nhé!'
      }));
      expect(mockPushItem.sent).toBe(true);
      expect(mockPushItem.save).toHaveBeenCalled();
    });
  });
});
