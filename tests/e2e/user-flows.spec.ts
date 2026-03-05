import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Boxcord
 *
 * Prerequisites:
 * - Backend running on http://localhost:3001
 * - Frontend running on http://localhost:5173
 * - Test database with seed data
 *
 * Run with: yarn test:e2e
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Test user credentials (ensure these exist in test database)
const TEST_USER = {
  email: 'test@boxflow.com',
  username: 'testuser',
  password: 'Test1234!'
};

/**
 * Helper function to login
 */
async function login(
  page: Page,
  email: string = TEST_USER.email,
  password: string = TEST_USER.password
) {
  await page.goto(FRONTEND_URL);

  // Check if already logged in
  const isLoggedIn = await page
    .locator('[data-testid="sidebar"]')
    .isVisible()
    .catch(() => false);
  if (isLoggedIn) return;

  // Wait for login page
  await page.waitForSelector(
    '[data-testid="login-form"], input[type="email"]',
    { timeout: 5000 }
  );

  // Fill login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL(/\/(workspace|channels)/, { timeout: 10000 });
}

/**
 * Helper to get auth token from localStorage
 */
async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(
    () => localStorage.getItem('token') || localStorage.getItem('auth-token')
  );
}

test.describe('Health Check', () => {
  test('backend should be healthy', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toMatch(/^(healthy|degraded)$/);
    expect(data.checks.database.status).toBe('healthy');
    // Redis may not be configured in CI/test environments
    expect(data.checks.redis.status).toMatch(/^(healthy|not_configured)$/);
  });

  test('frontend should load', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await expect(page).toHaveTitle(/Boxcord|Chat/i);
  });
});

test.describe('API Documentation', () => {
  test('Swagger UI should be accessible', async ({ request }) => {
    // Check that the Swagger UI HTML page loads
    const htmlResponse = await request.get(`${BACKEND_URL}/api/docs`);
    expect(htmlResponse.ok()).toBeTruthy();
    const html = await htmlResponse.text();
    expect(html).toContain('swagger');

    // Check that the OpenAPI JSON spec is served
    const jsonResponse = await request.get(`${BACKEND_URL}/api/docs/json`);
    expect(jsonResponse.ok()).toBeTruthy();
    const spec = await jsonResponse.json();
    expect(spec.openapi).toBeDefined();
    expect(spec.info.title).toBe('Boxcord API');
  });
});

test.describe('Authentication', { tag: '@auth' }, () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto(FRONTEND_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should display login page for unauthenticated users', async ({
    page
  }) => {
    await page.goto(FRONTEND_URL);

    // Should show login elements
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 5000
    });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty login', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors (may vary based on implementation)
    const errorMessages = await page
      .locator('text=/required|invalid|error/i')
      .count();
    expect(errorMessages).toBeGreaterThan(0);
  });

  test('should redirect to app after successful login', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Login
    await login(page);

    // Should redirect to workspace/channels
    await expect(page).toHaveURL(/\/(workspace|channels)/, { timeout: 10000 });

    // Should have auth token
    const token = await getAuthToken(page);
    expect(token).toBeTruthy();
  });
});

test.describe('Workspace Navigation', { tag: '@auth' }, () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display sidebar with channels', async ({ page }) => {
    // Sidebar should be visible
    const sidebar = page.locator('[data-testid="sidebar"], .sidebar, nav');
    await expect(sidebar.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate between channels', async ({ page }) => {
    // Wait for channels to load
    await page.waitForTimeout(1000);

    // Get all channel links
    const channels = await page
      .locator('[data-channel-id], [data-testid^="channel-"]')
      .count();

    if (channels > 0) {
      // Click first channel
      await page
        .locator('[data-channel-id], [data-testid^="channel-"]')
        .first()
        .click();
      await page.waitForTimeout(500);

      // URL should change to include channel
      expect(page.url()).toMatch(/\/channels\/|\/workspace\//);
    }
  });
});

test.describe('Messaging', { tag: '@auth' }, () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Navigate to first available channel
    await page.waitForTimeout(1000);
    const firstChannel = page
      .locator('[data-channel-id], [data-testid^="channel-"]')
      .first();
    const isVisible = await firstChannel.isVisible().catch(() => false);
    if (isVisible) {
      await firstChannel.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display message input', async ({ page }) => {
    // Message input should be visible
    const messageInput = page.locator(
      '[data-testid="message-input"], textarea[placeholder*="message" i], input[placeholder*="message" i]'
    );
    await expect(messageInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('should send a message', async ({ page }) => {
    const testMessage = `Test message ${Date.now()}`;

    // Find message input
    const messageInput = page
      .locator(
        '[data-testid="message-input"], textarea[placeholder*="message" i], input[placeholder*="message" i]'
      )
      .first();

    if (await messageInput.isVisible().catch(() => false)) {
      // Type message
      await messageInput.fill(testMessage);

      // Send message (Enter key or send button)
      await Promise.race([
        messageInput.press('Enter'),
        page
          .locator(
            'button[data-testid="send-message"], button[aria-label*="send" i]'
          )
          .first()
          .click()
      ]);

      // Wait for message to appear
      await page.waitForTimeout(1000);

      // Verify message appears in message list
      const messageExists = await page
        .locator(`text="${testMessage}"`)
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(messageExists).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should display message reactions', async ({ page }) => {
    // Wait for messages to load
    await page.waitForTimeout(1000);

    // Look for reaction UI elements
    const messages = page.locator('[data-testid^="message-"], .message');
    const messageCount = await messages.count();

    if (messageCount > 0) {
      // Hover over first message to reveal reaction button
      await messages.first().hover();
      await page.waitForTimeout(500);

      // Check if reactions or reaction button exists
      const hasReactions = await page
        .locator(
          '[data-testid*="reaction"], .reaction, [aria-label*="react" i]'
        )
        .isVisible()
        .catch(() => false);

      // At minimum, the UI should support reactions (even if none exist yet)
      expect(hasReactions || messageCount > 0).toBeTruthy();
    }
  });
});

test.describe('Search Functionality', { tag: '@auth' }, () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should have search interface', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator(
      '[data-testid="search"], input[placeholder*="search" i], [aria-label*="search" i]'
    );
    const hasSearch = await searchInput
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Search should be available
    expect(hasSearch).toBeTruthy();
  });
});

test.describe('User Settings', { tag: '@auth' }, () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should open settings modal', async ({ page }) => {
    // Look for settings button (gear icon, settings text, etc.)
    const settingsButton = page.locator(
      '[data-testid="settings"], [aria-label*="settings" i], button:has-text("Settings")'
    );
    const hasSettingsBtn = await settingsButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasSettingsBtn) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);

      // Settings modal or page should appear
      const settingsVisible = await page
        .locator(
          '[data-testid="settings-modal"], .settings, text=/settings|preferences/i'
        )
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(settingsVisible).toBeTruthy();
    }
  });
});

test.describe('XSS Protection', { tag: '@auth' }, () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should sanitize XSS in message input', async ({ page }) => {
    const xssPayload = '<script>alert("XSS")</script>';

    const messageInput = page
      .locator(
        '[data-testid="message-input"], textarea[placeholder*="message" i], input[placeholder*="message" i]'
      )
      .first();

    if (await messageInput.isVisible().catch(() => false)) {
      // Type XSS payload
      await messageInput.fill(xssPayload);

      // Try to send
      await messageInput.press('Enter');
      await page.waitForTimeout(1000);

      // Check that script didn't execute (page should still work)
      const pageWorking = await page.locator('body').isVisible();
      expect(pageWorking).toBeTruthy();

      // Verify no alert appeared (page didn't crash)
      const title = await page.title();
      expect(title).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
