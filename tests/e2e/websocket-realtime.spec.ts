import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * WebSocket Real-Time E2E Tests
 *
 * Tests real-time functionality via WebSocket:
 * - Live message delivery
 * - Typing indicators
 * - User presence (online/offline status)
 * - Real-time reactions
 * - Message editing propagation
 * - Voice channel join/leave events
 *
 * Setup: Uses two browser contexts to simulate multiple users
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Helper: Setup authenticated page
 */
async function setupAuthenticatedPage(
  page: Page,
  userId: string = 'test-user-1'
): Promise<void> {
  const mockToken = Buffer.from(
    JSON.stringify({
      sub: userId,
      email: `${userId}@boxflow.com`,
      exp: Math.floor(Date.now() / 1000) + 3600
    })
  ).toString('base64');

  await page.goto(FRONTEND_URL);
  await page.evaluate((token) => {
    localStorage.setItem('auth-token', `Bearer.${token}.sig`);
  }, mockToken);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Helper: Navigate to first channel
 */
async function navigateToChannel(page: Page): Promise<void> {
  const firstChannel = page.locator('[data-channel-id]').first();
  if (await firstChannel.isVisible({ timeout: 5000 }).catch(() => false)) {
    await firstChannel.click();
    await page.waitForTimeout(500);
  }
}

test.describe('WebSocket - Live Messages', { tag: '@auth' }, () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    // Create two separate browser contexts (two users)
    context1 = await browser.newContext();
    context2 = await browser.newContext();

    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // Setup both users
    await setupAuthenticatedPage(page1, 'test-user-1');
    await setupAuthenticatedPage(page2, 'test-user-2');

    // Navigate both to same channel
    await navigateToChannel(page1);
    await navigateToChannel(page2);
  });

  test.afterEach(async () => {
    await context1.close();
    await context2.close();
  });

  test('should deliver message in real-time to other users', async () => {
    const testMessage = `Real-time message ${Date.now()}`;

    // User 1 sends message
    const messageInput1 = page1
      .locator('[data-testid="message-input"]')
      .first();
    if (await messageInput1.isVisible().catch(() => false)) {
      await messageInput1.fill(testMessage);
      await messageInput1.press('Enter');

      await page1.waitForTimeout(500);

      // User 2 should see the message immediately
      const messageVisible = await page2
        .locator(`text="${testMessage}"`)
        .isVisible({ timeout: 3000 });

      expect(messageVisible).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should update message count in real-time', async () => {
    // Get initial message count on page2
    const messages2Before = await page2.locator('[data-message-id]').count();

    // User 1 sends message
    const messageInput1 = page1
      .locator('[data-testid="message-input"]')
      .first();
    if (await messageInput1.isVisible().catch(() => false)) {
      await messageInput1.fill('Message count test');
      await messageInput1.press('Enter');

      await page2.waitForTimeout(1000);

      // Check message count increased on page2
      const messages2After = await page2.locator('[data-message-id]').count();
      expect(messages2After).toBeGreaterThan(messages2Before);
    }
  });
});

test.describe('WebSocket - Typing Indicators', { tag: '@auth' }, () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    context1 = await browser.newContext();
    context2 = await browser.newContext();

    page1 = await context1.newPage();
    page2 = await context2.newPage();

    await setupAuthenticatedPage(page1, 'test-user-1');
    await setupAuthenticatedPage(page2, 'test-user-2');

    await navigateToChannel(page1);
    await navigateToChannel(page2);
  });

  test.afterEach(async () => {
    await context1.close();
    await context2.close();
  });

  test('should show typing indicator when user is typing', async () => {
    const messageInput1 = page1
      .locator('[data-testid="message-input"]')
      .first();

    if (await messageInput1.isVisible().catch(() => false)) {
      // User 1 starts typing
      await messageInput1.fill('T');
      await page1.waitForTimeout(500);

      // User 2 should see typing indicator
      const typingIndicator = page2.locator(
        '[data-testid="typing-indicator"], text=/is typing/i'
      );
      const isVisible = await typingIndicator
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(isVisible).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should hide typing indicator after message sent', async () => {
    const messageInput1 = page1
      .locator('[data-testid="message-input"]')
      .first();

    if (await messageInput1.isVisible().catch(() => false)) {
      // User 1 types and sends
      await messageInput1.fill('Test');
      await page1.waitForTimeout(500);

      // Check indicator appears
      let typingVisible = await page2
        .locator('[data-testid="typing-indicator"]')
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      // Send message
      await messageInput1.press('Enter');
      await page2.waitForTimeout(1000);

      // Typing indicator should disappear
      typingVisible = await page2
        .locator('[data-testid="typing-indicator"]')
        .isVisible()
        .catch(() => false);

      expect(typingVisible).toBeFalsy();
    }
  });
});

test.describe('WebSocket - User Presence', { tag: '@auth' }, () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    context1 = await browser.newContext();
    context2 = await browser.newContext();

    page1 = await context1.newPage();
    page2 = await context2.newPage();

    await setupAuthenticatedPage(page1, 'test-user-1');
    await setupAuthenticatedPage(page2, 'test-user-2');
  });

  test.afterEach(async () => {
    await context1.close();
    await context2.close();
  });

  test('should show user online when they connect', async () => {
    // Navigate to member list or check presence indicator
    const memberList = page1.locator(
      '[data-testid="member-list"], [data-testid="members"]'
    );

    if (await memberList.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Look for online indicator for user 2
      const onlineIndicator = page1.locator(
        '[data-user-id="test-user-2"] [data-testid="online-indicator"], [data-status="online"]'
      );

      const isOnline = await onlineIndicator
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(isOnline).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should update presence when user goes offline', async () => {
    // Check user 2 is online
    const memberList = page1.locator('[data-testid="member-list"]');

    if (await memberList.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Close page2 (user goes offline)
      await page2.close();
      await page1.waitForTimeout(2000);

      // User 2 should now show as offline
      const offlineIndicator = page1.locator(
        '[data-user-id="test-user-2"] [data-testid="offline-indicator"], [data-status="offline"]'
      );

      const isOffline = await offlineIndicator
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      expect(isOffline).toBeTruthy();
    }
  });
});

test.describe('WebSocket - Real-Time Reactions', { tag: '@auth' }, () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    context1 = await browser.newContext();
    context2 = await browser.newContext();

    page1 = await context1.newPage();
    page2 = await context2.newPage();

    await setupAuthenticatedPage(page1, 'test-user-1');
    await setupAuthenticatedPage(page2, 'test-user-2');

    await navigateToChannel(page1);
    await navigateToChannel(page2);

    // User 1 sends a message
    const messageInput = page1.locator('[data-testid="message-input"]').first();
    if (await messageInput.isVisible().catch(() => false)) {
      await messageInput.fill(`Message to react to ${Date.now()}`);
      await messageInput.press('Enter');
      await page1.waitForTimeout(1000);
    }
  });

  test.afterEach(async () => {
    await context1.close();
    await context2.close();
  });

  test('should show reaction in real-time on other clients', async () => {
    // User 2 reacts to latest message
    const lastMessage = page2.locator('[data-message-id]').last();

    if (await lastMessage.isVisible().catch(() => false)) {
      await lastMessage.hover();
      await page2.waitForTimeout(300);

      const reactionBtn = page2.locator('[data-testid="add-reaction"]').first();
      if (await reactionBtn.isVisible().catch(() => false)) {
        await reactionBtn.click();
        await page2.waitForTimeout(300);

        // Select emoji (👍)
        const thumbsUp = page2.locator('[data-emoji="👍"], text="👍"').first();
        if (await thumbsUp.isVisible().catch(() => false)) {
          await thumbsUp.click();
          await page2.waitForTimeout(500);

          // User 1 should see the reaction immediately
          const reaction = page1.locator(
            '[data-testid="reaction"]:has-text("👍")'
          );
          const isVisible = await reaction
            .isVisible({ timeout: 3000 })
            .catch(() => false);

          expect(isVisible).toBeTruthy();
        }
      }
    }
  });
});

test.describe('WebSocket - Message Editing', { tag: '@auth' }, () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    context1 = await browser.newContext();
    context2 = await browser.newContext();

    page1 = await context1.newPage();
    page2 = await context2.newPage();

    await setupAuthenticatedPage(page1, 'test-user-1');
    await setupAuthenticatedPage(page2, 'test-user-2');

    await navigateToChannel(page1);
    await navigateToChannel(page2);
  });

  test.afterEach(async () => {
    await context1.close();
    await context2.close();
  });

  test('should propagate message edits in real-time', async () => {
    const originalMessage = `Original ${Date.now()}`;
    const editedMessage = `Edited ${Date.now()}`;

    // User 1 sends message
    const messageInput1 = page1
      .locator('[data-testid="message-input"]')
      .first();
    if (await messageInput1.isVisible().catch(() => false)) {
      await messageInput1.fill(originalMessage);
      await messageInput1.press('Enter');
      await page1.waitForTimeout(1000);

      // Both users see original message
      expect(
        await page2
          .locator(`text="${originalMessage}"`)
          .isVisible({ timeout: 2000 })
      ).toBeTruthy();

      // User 1 edits message
      const lastMessage = page1.locator('[data-message-id]').last();
      await lastMessage.hover();
      await page1.waitForTimeout(300);

      const editBtn = page1.locator('[data-testid="edit-message"]').first();
      if (await editBtn.isVisible().catch(() => false)) {
        await editBtn.click();
        await page1.waitForTimeout(300);

        // Edit input should appear
        const editInput = page1.locator('[data-testid="edit-input"]');
        if (await editInput.isVisible().catch(() => false)) {
          await editInput.fill(editedMessage);
          await editInput.press('Enter');
          await page1.waitForTimeout(1000);

          // User 2 should see edited message
          const editedVisible = await page2
            .locator(`text="${editedMessage}"`)
            .isVisible({ timeout: 3000 });

          expect(editedVisible).toBeTruthy();

          // Original message should not be visible
          const originalGone = !(await page2
            .locator(`text="${originalMessage}"`)
            .isVisible()
            .catch(() => false));

          expect(originalGone).toBeTruthy();
        }
      }
    }
  });
});

test.describe('WebSocket - Voice Channel Events', { tag: '@auth' }, () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    context1 = await browser.newContext();
    context2 = await browser.newContext();

    page1 = await context1.newPage();
    page2 = await context2.newPage();

    await setupAuthenticatedPage(page1, 'test-user-1');
    await setupAuthenticatedPage(page2, 'test-user-2');
  });

  test.afterEach(async () => {
    await context1.close();
    await context2.close();
  });

  test('should show voice channel participants in real-time', async () => {
    // Find voice channel
    const voiceChannel = page1.locator('[data-channel-type="VOICE"]').first();

    if (await voiceChannel.isVisible({ timeout: 5000 }).catch(() => false)) {
      // User 1 joins voice channel
      await voiceChannel.click();
      await page1.waitForTimeout(1000);

      // Navigate user 2 to same workspace
      await page2.waitForTimeout(1000);

      // User 2 should see user 1 in voice channel participant list
      const participant = page2.locator(
        '[data-testid="voice-participant"][data-user-id="test-user-1"]'
      );

      const isVisible = await participant
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(isVisible).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
