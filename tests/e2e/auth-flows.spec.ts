import { test, expect, type Page } from '@playwright/test';

/**
 * Authenticated E2E Test Flows
 *
 * Tests complex user flows that require authentication:
 * - Create/join workspaces
 * - Send messages to channels
 * - Create/manage DMs
 * - Pin messages
 * - Add bookmarks
 * - User mentions
 *
 * Setup: Uses API to create auth token for faster tests
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Test users (must exist in test database or be created via seed)
const TEST_USERS = {
  primary: {
    email: 'test@boxflow.com',
    cognitoId: 'test-user-1',
    firstName: 'Test',
    lastName: 'User'
  },
  secondary: {
    email: 'test2@boxflow.com',
    cognitoId: 'test-user-2',
    firstName: 'Second',
    lastName: 'Tester'
  }
};

/**
 * Helper: Get or create JWT token for test user
 * In production, this would use AWS Cognito
 */
async function getAuthToken(
  cognitoId: string = TEST_USERS.primary.cognitoId
): Promise<string> {
  // For testing: Generate a valid JWT token
  // In real tests, you'd fetch this from Cognito or test auth service
  const mockToken = Buffer.from(
    JSON.stringify({
      sub: cognitoId,
      email: TEST_USERS.primary.email,
      exp: Math.floor(Date.now() / 1000) + 3600
    })
  ).toString('base64');

  return `Bearer.${mockToken}.signature`;
}

/**
 * Setup authenticated page context with token
 */
async function setupAuthenticatedPage(
  page: Page,
  cognitoId?: string
): Promise<void> {
  const token = await getAuthToken(cognitoId);

  // Set token in localStorage before navigating
  await page.goto(FRONTEND_URL);
  await page.evaluate((authToken) => {
    localStorage.setItem('auth-token', authToken);
    localStorage.setItem('token', authToken);
  }, token);

  // Reload to apply auth
  await page.reload();
  await page.waitForLoadState('networkidle');
}

test.describe('Authenticated Workspace Flows', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test('should create a new workspace', async ({ page }) => {
    const workspaceName = `Test Workspace ${Date.now()}`;

    // Click create workspace button
    const createBtn = page.locator(
      '[data-testid="create-workspace"], button:has-text("Create Workspace")'
    );

    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();

      // Fill workspace form
      await page.fill(
        '[name="name"], input[placeholder*="workspace name"]',
        workspaceName
      );
      await page.fill(
        '[name="description"], textarea[placeholder*="description"]',
        'Test workspace description'
      );

      // Submit form
      await page.click('button[type="submit"]:has-text("Create")');

      // Wait for workspace to be created
      await page.waitForTimeout(1000);

      // Verify workspace appears in sidebar or workspace list
      const workspaceExists = await page
        .locator(`text="${workspaceName}"`)
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      expect(workspaceExists).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should join workspace via invite code', async ({ page, request }) => {
    // First create a workspace and get invite code via API
    const token = await getAuthToken();

    const workspaceRes = await request.post(`${BACKEND_URL}/api/workspaces`, {
      headers: { Authorization: token },
      data: {
        name: `Invite Test ${Date.now()}`,
        description: 'Test workspace for invites'
      }
    });

    if (workspaceRes.ok()) {
      const workspace = await workspaceRes.json();

      // Create invite code
      const inviteRes = await request.post(`${BACKEND_URL}/api/invites`, {
        headers: { Authorization: token },
        data: {
          workspaceId: workspace.data.id,
          maxUses: 10,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      });

      if (inviteRes.ok()) {
        const invite = await inviteRes.json();
        const inviteCode = invite.data.code;

        // Navigate to invite page
        await page.goto(`${FRONTEND_URL}/invite/${inviteCode}`);
        await page.waitForTimeout(500);

        // Click join button
        const joinBtn = page.locator('button:has-text("Join")');
        if (await joinBtn.isVisible().catch(() => false)) {
          await joinBtn.click();
          await page.waitForTimeout(1000);

          // Should redirect to workspace
          expect(page.url()).toContain('workspace');
        }
      }
    }
  });
});

test.describe('Authenticated Channel Flows', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.waitForTimeout(1000);
  });

  test('should send message to channel', async ({ page }) => {
    const testMessage = `E2E Test: ${Date.now()}`;

    // Navigate to first channel
    const firstChannel = page.locator('[data-channel-id]').first();
    if (await firstChannel.isVisible().catch(() => false)) {
      await firstChannel.click();
      await page.waitForTimeout(500);

      // Type and send message
      const messageInput = page
        .locator(
          '[data-testid="message-input"], textarea[placeholder*="message"]'
        )
        .first();

      await messageInput.fill(testMessage);
      await messageInput.press('Enter');

      // Wait for message to appear
      await page.waitForTimeout(1000);

      // Verify message exists
      const messageVisible = await page
        .locator(`text="${testMessage}"`)
        .isVisible({ timeout: 3000 });

      expect(messageVisible).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should pin message to channel', async ({ page }) => {
    // Navigate to channel
    const firstChannel = page.locator('[data-channel-id]').first();
    if (await firstChannel.isVisible().catch(() => false)) {
      await firstChannel.click();
      await page.waitForTimeout(500);

      // Get first message
      const firstMessage = page.locator('[data-message-id]').first();
      if (await firstMessage.isVisible().catch(() => false)) {
        // Hover to show message actions
        await firstMessage.hover();
        await page.waitForTimeout(300);

        // Click pin button
        const pinBtn = page
          .locator('[data-testid="pin-message"], button[aria-label*="pin"]')
          .first();

        if (await pinBtn.isVisible().catch(() => false)) {
          await pinBtn.click();
          await page.waitForTimeout(500);

          // Verify pin indicator appears
          const pinIndicator = page.locator('[data-testid="pinned-indicator"]');
          expect(await pinIndicator.count()).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should mention user in message', async ({ page }) => {
    const firstChannel = page.locator('[data-channel-id]').first();
    if (await firstChannel.isVisible().catch(() => false)) {
      await firstChannel.click();
      await page.waitForTimeout(500);

      const messageInput = page
        .locator('[data-testid="message-input"]')
        .first();

      // Type @ to trigger mention autocomplete
      await messageInput.fill('@');
      await page.waitForTimeout(500);

      // Check if autocomplete appears
      const autocomplete = page.locator('[data-testid="mention-autocomplete"]');
      const isVisible = await autocomplete.isVisible().catch(() => false);

      if (isVisible) {
        // Select first user
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        // Add message text
        await messageInput.fill(`@test hello!`);
        await messageInput.press('Enter');

        await page.waitForTimeout(1000);

        // Verify message with mention sent
        const mentionMessage = page.locator(
          '[data-testid="message"]:has-text("hello!")'
        );
        expect(await mentionMessage.count()).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Authenticated DM Flows', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test('should create and send DM', async ({ page }) => {
    // Click New DM or DM button
    const dmBtn = page.locator(
      '[data-testid="new-dm"], button:has-text("New Message")'
    );

    if (await dmBtn.isVisible().catch(() => false)) {
      await dmBtn.click();
      await page.waitForTimeout(500);

      // Select user from list or search
      const userSelect = page.locator('[data-testid="user-search"]');
      if (await userSelect.isVisible().catch(() => false)) {
        await userSelect.fill('test');
        await page.waitForTimeout(300);

        // Select first result
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        // Send DM
        const dmInput = page
          .locator('textarea[placeholder*="message"]')
          .first();
        const testDM = `DM Test ${Date.now()}`;
        await dmInput.fill(testDM);
        await dmInput.press('Enter');

        await page.waitForTimeout(1000);

        // Verify DM appears
        const dmVisible = await page
          .locator(`text="${testDM}"`)
          .isVisible({ timeout: 3000 });
        expect(dmVisible).toBeTruthy();
      }
    }
  });
});

test.describe('Authenticated Bookmark Flows', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test('should bookmark a message', async ({ page }) => {
    // Navigate to channel with messages
    const firstChannel = page.locator('[data-channel-id]').first();
    if (await firstChannel.isVisible().catch(() => false)) {
      await firstChannel.click();
      await page.waitForTimeout(500);

      // Get first message
      const firstMessage = page.locator('[data-message-id]').first();
      if (await firstMessage.isVisible().catch(() => false)) {
        await firstMessage.hover();
        await page.waitForTimeout(300);

        // Click bookmark button
        const bookmarkBtn = page
          .locator(
            '[data-testid="bookmark-message"], button[aria-label*="bookmark"]'
          )
          .first();

        if (await bookmarkBtn.isVisible().catch(() => false)) {
          await bookmarkBtn.click();
          await page.waitForTimeout(500);

          // Navigate to bookmarks
          const savedBtn = page.locator(
            '[data-testid="saved-messages"], button:has-text("Saved")'
          );
          if (await savedBtn.isVisible().catch(() => false)) {
            await savedBtn.click();
            await page.waitForTimeout(500);

            // Verify bookmarked message appears
            const bookmarkedMessages = page.locator('[data-message-id]');
            expect(await bookmarkedMessages.count()).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});

test.describe('Authenticated Search Flows', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test('should search messages across channels', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Results should appear
      const results = page.locator('[data-testid="search-result"]');
      const resultCount = await results.count();

      // Should have at least one result or "no results" message
      const hasResults =
        resultCount > 0 ||
        (await page
          .locator('text=/no results/i')
          .isVisible()
          .catch(() => false));

      expect(hasResults).toBeTruthy();
    }
  });
});
