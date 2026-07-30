import { beforeEach, describe, expect, it, vi } from 'vitest';
import Bio from '../models/Bio.js';
import joyRoutes from '../routes/joyRoutes.js';
import { awardJoy } from '../utils/joyService.js';

vi.mock('../models/Bio.js', () => ({
  default: { findOne: vi.fn() },
}));

vi.mock('../utils/joyService.js', () => ({
  awardJoy: vi.fn(),
  getJoyHistory: vi.fn(),
}));

const handlers = {};
joyRoutes.stack.forEach((layer) => {
  if (!layer.route) return;
  const method = Object.keys(layer.route.methods)[0].toUpperCase();
  handlers[`${method} ${layer.route.path}`] =
    layer.route.stack[layer.route.stack.length - 1].handle;
});

const mockResponse = () => {
  const response = { statusCode: 200, body: null };
  response.status = (statusCode) => {
    response.statusCode = statusCode;
    return response;
  };
  response.json = (body) => {
    response.body = body;
    return response;
  };
  return response;
};

describe('HugoSO course access and purchase routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    awardJoy.mockResolvedValue({ balance: 648 });
  });

  it('registers both endpoints on the JOY router', () => {
    expect(handlers['GET /hugoso-access']).toBeTypeOf('function');
    expect(handlers['POST /buy-hugoso-course']).toBeTypeOf('function');
  });

  it('returns lifetime ownership and server-authoritative pricing', async () => {
    Bio.findOne.mockResolvedValue({
      email: 'member@example.com',
      joyBalance: 1000,
      hugoSOCourses: ['docs'],
    });

    const response = mockResponse();
    await handlers['GET /hugoso-access'](
      { memberEmail: 'member@example.com' },
      response,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.ownedCourses).toEqual(['docs']);
    expect(response.body.pricing.calendar).toEqual({
      priceJoy: 320,
      tax: 32,
      total: 352,
    });
    expect(response.body.balance).toBe(1000);
  });

  it('charges JOY and persists the purchased course', async () => {
    const bio = {
      email: 'member@example.com',
      joyBalance: 1000,
      hugoSOCourses: [],
      markModified: vi.fn(),
      save: vi.fn().mockResolvedValue(true),
    };
    Bio.findOne.mockResolvedValue(bio);

    const response = mockResponse();
    await handlers['POST /buy-hugoso-course'](
      {
        memberEmail: 'member@example.com',
        body: { courseId: 'calendar' },
      },
      response,
    );

    expect(awardJoy).toHaveBeenCalledWith(
      'member@example.com',
      -352,
      'hugoso_course',
      expect.stringContaining('Google Calendar'),
      expect.objectContaining({
        bioDoc: bio,
        skipSave: true,
        refId: 'hugoso_calendar',
      }),
    );
    expect(bio.hugoSOCourses).toEqual(['calendar']);
    expect(bio.markModified).toHaveBeenCalledWith('hugoSOCourses');
    expect(bio.save).toHaveBeenCalled();
    expect(response.body).toEqual({
      success: true,
      balance: 648,
      ownedCourses: ['calendar'],
      unlockedCourses: ['calendar'],
    });
  });
});
