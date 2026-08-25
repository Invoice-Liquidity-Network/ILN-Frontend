import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/feedback/route';

/**
 * Integration coverage for the /api/feedback route backing the testnet feedback
 * widget. Client-side UI states (success/error/rate-limit rendering) are covered
 * separately in src/components/__tests__/FeedbackWidget.test.tsx - this file
 * verifies the route itself always resolves to a JSON body with either a
 * `success` or `error` field, regardless of GitHub Issues API outcome, so a
 * broken backend integration can never silently drop feedback with no signal.
 */

const validPayload = {
  rating: 5,
  category: 'Bug',
  feedback: 'Something is broken on the invoice page.',
  email: 'tester@example.com',
};

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/feedback', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('/api/feedback API route', () => {
  const originalEnv = { ...process.env };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env = { ...originalEnv };
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.GITHUB_OWNER = 'test-owner';
    process.env.GITHUB_REPO = 'test-repo';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  describe('valid submission', () => {
    it('creates a GitHub issue and returns success with the issue URL', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: async () => ({ html_url: 'https://github.com/test-owner/test-repo/issues/42' }),
      });

      const response = await POST(makeRequest(validPayload));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        issueUrl: 'https://github.com/test-owner/test-repo/issues/42',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.github.com/repos/test-owner/test-repo/issues',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      );
      const [, options] = fetchMock.mock.calls[0];
      const requestBody = JSON.parse(options.body);
      expect(requestBody.title).toBe('[Feedback] Bug: 5 stars');
      expect(requestBody.labels).toEqual(['feedback', 'bug']);
    });

    it('still returns a clear success state when GitHub is not configured', async () => {
      delete process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_OWNER;
      delete process.env.GITHUB_REPO;

      const response = await POST(makeRequest(validPayload));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('missing required fields', () => {
    it.each([
      ['rating', { ...validPayload, rating: undefined }],
      ['category', { ...validPayload, category: undefined }],
      ['feedback', { ...validPayload, feedback: undefined }],
    ])('returns 400 when %s is missing', async (_field, payload) => {
      const response = await POST(makeRequest(payload));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ error: 'Missing required fields' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not require email', async () => {
      const { email: _email, ...payloadWithoutEmail } = validPayload;
      fetchMock.mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: async () => ({ html_url: 'https://github.com/test-owner/test-repo/issues/43' }),
      });

      const response = await POST(makeRequest(payloadWithoutEmail));

      expect(response.status).toBe(200);
      const [, options] = fetchMock.mock.calls[0];
      expect(JSON.parse(options.body).body).toContain('Not provided');
    });
  });

  describe('GitHub API failure handling', () => {
    it('returns a rate_limit error with retryAfter when GitHub rate limits the request', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '120' }),
        json: async () => ({}),
      });

      const response = await POST(makeRequest(validPayload));
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body).toEqual({ error: 'rate_limit', retryAfter: 120 });
    });

    it('falls back to a 60s retryAfter when GitHub omits the Retry-After header', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers(),
        json: async () => ({}),
      });

      const response = await POST(makeRequest(validPayload));
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body).toEqual({ error: 'rate_limit', retryAfter: 60 });
    });

    it('returns a 500 with a clear error when the GitHub API call fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: async () => ({ message: 'Internal Server Error' }),
      });

      const response = await POST(makeRequest(validPayload));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ error: 'Internal server error' });
    });

    it('returns a 500 with a clear error when the network request throws', async () => {
      fetchMock.mockRejectedValue(new TypeError('network error'));

      const response = await POST(makeRequest(validPayload));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ error: 'Internal server error' });
    });
  });
});
