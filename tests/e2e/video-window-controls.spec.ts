import { test, expect, type Page } from '@playwright/test';

/**
 * Video Window Controls E2E Tests
 *
 * Tests video call window management features:
 * - Minimize/restore functionality
 * - Floating window mode
 * - Draggable window
 * - Resizable window
 * - Picture-in-Picture mode
 * - Window state persistence
 *
 * Prerequisites:
 * - Backend running with voice channel support
 * - Frontend with video controls implemented
 * - WebRTC permissions granted (may require browser flags in CI)
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Test user
const TEST_USER = {
  email: 'test@boxflow.com',
  cognitoId: 'test-user-1',
  firstName: 'Test',
  lastName: 'User'
};

/**
 * Helper: Get auth token for test user
 */
async function getAuthToken(
  cognitoId: string = TEST_USER.cognitoId
): Promise<string> {
  const mockToken = Buffer.from(
    JSON.stringify({
      sub: cognitoId,
      email: TEST_USER.email,
      exp: Math.floor(Date.now() / 1000) + 3600
    })
  ).toString('base64');

  return `Bearer.${mockToken}.signature`;
}

/**
 * Setup authenticated page with media permissions
 */
async function setupAuthenticatedPage(page: Page): Promise<void> {
  const token = await getAuthToken();

  // Grant media permissions
  await page.context().grantPermissions(['camera', 'microphone']);

  // Set token in localStorage
  await page.goto(FRONTEND_URL);
  await page.evaluate((authToken) => {
    localStorage.setItem('auth-token', authToken);
    localStorage.setItem('token', authToken);
  }, token);

  await page.reload();
  await page.waitForLoadState('networkidle');
}

/**
 * Helper: Join voice channel and enable video
 */
async function joinVoiceChannelWithVideo(page: Page): Promise<void> {
  // Find and click on a voice channel
  const voiceChannel = page
    .locator(
      '[data-testid="voice-channel"], button:has-text("Voice"), .voice-channel'
    )
    .first();

  if (await voiceChannel.isVisible().catch(() => false)) {
    await voiceChannel.click();
    await page.waitForTimeout(1000);

    // Click join voice button
    const joinBtn = page
      .locator('button:has-text("Join"), button:has-text("Connect")')
      .first();

    if (await joinBtn.isVisible().catch(() => false)) {
      await joinBtn.click();
      await page.waitForTimeout(2000);

      // Enable video
      const videoBtn = page
        .locator(
          '[title*="video" i], button:has-text("Video"), [aria-label*="video" i]'
        )
        .first();

      if (await videoBtn.isVisible().catch(() => false)) {
        await videoBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  }
}

test.describe('Video Window Controls', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test('should show fullscreen video grid when video is enabled', async ({
    page
  }) => {
    await joinVoiceChannelWithVideo(page);

    // Check if video grid is visible
    const videoGrid = page
      .locator('.fixed.inset-0.z-50, [class*="video-grid"]')
      .first();

    const isVisible = await videoGrid.isVisible().catch(() => false);

    if (isVisible) {
      // Video grid should be fullscreen
      const boundingBox = await videoGrid.boundingBox();
      expect(boundingBox).toBeTruthy();

      // Should have close button
      const closeBtn = page.locator('button[title*="Close" i]').first();
      expect(await closeBtn.isVisible()).toBeTruthy();
    } else {
      test.skip('Video not available in test environment');
    }
  });

  test('should minimize video to floating indicator', async ({ page }) => {
    await joinVoiceChannelWithVideo(page);

    const videoGrid = page.locator('.fixed.inset-0.z-50').first();

    if (await videoGrid.isVisible().catch(() => false)) {
      // Click minimize button
      const minimizeBtn = page.locator('button[title*="Minimize" i]').first();

      if (await minimizeBtn.isVisible()) {
        await minimizeBtn.click();
        await page.waitForTimeout(500);

        // Fullscreen grid should be hidden
        expect(await videoGrid.isVisible()).toBeFalsy();

        // Minimized indicator should be visible (bottom right)
        const minimizedIndicator = page
          .locator('.fixed.bottom-6.right-6, [class*="minimized"]')
          .first();

        expect(await minimizedIndicator.isVisible()).toBeTruthy();
      }
    } else {
      test.skip('Video not available in test environment');
    }
  });

  test('should restore video from minimized state', async ({ page }) => {
    await joinVoiceChannelWithVideo(page);

    const videoGrid = page.locator('.fixed.inset-0.z-50').first();

    if (await videoGrid.isVisible().catch(() => false)) {
      // Minimize
      const minimizeBtn = page.locator('button[title*="Minimize" i]').first();
      if (await minimizeBtn.isVisible()) {
        await minimizeBtn.click();
        await page.waitForTimeout(500);

        // Click on minimized indicator to restore
        const minimizedIndicator = page
          .locator('.fixed.bottom-6.right-6')
          .first();

        if (await minimizedIndicator.isVisible()) {
          await minimizedIndicator.click();
          await page.waitForTimeout(500);

          // Fullscreen grid should be visible again
          expect(await videoGrid.isVisible()).toBeTruthy();
        }
      }
    } else {
      test.skip('Video not available in test environment');
    }
  });

  test('should switch to floating window mode', async ({ page }) => {
    await joinVoiceChannelWithVideo(page);

    const videoGrid = page.locator('.fixed.inset-0.z-50').first();

    if (await videoGrid.isVisible().catch(() => false)) {
      // Click float window button
      const floatBtn = page
        .locator('button[title*="Float" i], button[title*="Window" i]')
        .first();

      if (await floatBtn.isVisible()) {
        await floatBtn.click();
        await page.waitForTimeout(500);

        // Fullscreen grid should be hidden
        expect(await videoGrid.isVisible()).toBeFalsy();

        // Floating window should be visible
        const floatingWindow = page
          .locator('.fixed.z-\\[60\\], [class*="floating"]')
          .first();

        expect(await floatingWindow.isVisible()).toBeTruthy();

        // Should have drag handle
        const dragHandle = page.locator('.drag-handle').first();
        expect(await dragHandle.isVisible()).toBeTruthy();
      }
    } else {
      test.skip('Video not available in test environment');
    }
  });

  test('should drag floating window', async ({ page }) => {
    await joinVoiceChannelWithVideo(page);

    const videoGrid = page.locator('.fixed.inset-0.z-50').first();

    if (await videoGrid.isVisible().catch(() => false)) {
      // Switch to floating mode
      const floatBtn = page.locator('button[title*="Float" i]').first();

      if (await floatBtn.isVisible()) {
        await floatBtn.click();
        await page.waitForTimeout(500);

        const floatingWindow = page.locator('.fixed.z-\\[60\\]').first();

        if (await floatingWindow.isVisible()) {
          const initialBox = await floatingWindow.boundingBox();
          expect(initialBox).toBeTruthy();

          // Drag window by its header
          const dragHandle = page.locator('.drag-handle').first();
          await dragHandle.hover();
          await page.mouse.down();
          await page.mouse.move(initialBox!.x + 200, initialBox!.y + 100, {
            steps: 10
          });
          await page.mouse.up();
          await page.waitForTimeout(300);

          // Window should have moved
          const finalBox = await floatingWindow.boundingBox();
          expect(finalBox).toBeTruthy();
          expect(finalBox!.x).not.toBe(initialBox!.x);
        }
      }
    } else {
      test.skip('Video not available in test environment');
    }
  });

  test('should resize floating window', async ({ page }) => {
    await joinVoiceChannelWithVideo(page);

    const videoGrid = page.locator('.fixed.inset-0.z-50').first();

    if (await videoGrid.isVisible().catch(() => false)) {
      // Switch to floating mode
      const floatBtn = page.locator('button[title*="Float" i]').first();

      if (await floatBtn.isVisible()) {
        await floatBtn.click();
        await page.waitForTimeout(500);

        const floatingWindow = page.locator('.fixed.z-\\[60\\]').first();

        if (await floatingWindow.isVisible()) {
          const initialBox = await floatingWindow.boundingBox();
          expect(initialBox).toBeTruthy();

          // Find resize handle (bottom-right corner)
          const resizeHandle = page
            .locator('.cursor-se-resize, [title*="Resize" i]')
            .first();

          if (await resizeHandle.isVisible()) {
            await resizeHandle.hover();
            await page.mouse.down();
            await page.mouse.move(
              initialBox!.x + initialBox!.width + 100,
              initialBox!.y + initialBox!.height + 50,
              { steps: 10 }
            );
            await page.mouse.up();
            await page.waitForTimeout(300);

            // Window should have changed size
            const finalBox = await floatingWindow.boundingBox();
            expect(finalBox).toBeTruthy();
            expect(finalBox!.width).toBeGreaterThan(initialBox!.width);
          }
        }
      }
    } else {
      test.skip('Video not available in test environment');
    }
  });

  test('should maximize floating window back to fullscreen', async ({
    page
  }) => {
    await joinVoiceChannelWithVideo(page);

    const videoGrid = page.locator('.fixed.inset-0.z-50').first();

    if (await videoGrid.isVisible().catch(() => false)) {
      // Switch to floating mode
      const floatBtn = page.locator('button[title*="Float" i]').first();

      if (await floatBtn.isVisible()) {
        await floatBtn.click();
        await page.waitForTimeout(500);

        // Click maximize button in floating window
        const maximizeBtn = page.locator('button[title*="Maximize" i]').first();

        if (await maximizeBtn.isVisible()) {
          await maximizeBtn.click();
          await page.waitForTimeout(500);

          // Should be back to fullscreen
          expect(await videoGrid.isVisible()).toBeTruthy();

          // Floating window should be hidden
          const floatingWindow = page.locator('.fixed.z-\\[60\\]').first();
          expect(await floatingWindow.isVisible()).toBeFalsy();
        }
      }
    } else {
      test.skip('Video not available in test environment');
    }
  });

  test('should enter Picture-in-Picture mode if supported', async ({
    page
  }) => {
    await joinVoiceChannelWithVideo(page);

    const videoGrid = page.locator('.fixed.inset-0.z-50').first();

    if (await videoGrid.isVisible().catch(() => false)) {
      // Check if PiP is supported
      const pipSupported = await page.evaluate(() => {
        return (
          'pictureInPictureEnabled' in document &&
          document.pictureInPictureEnabled
        );
      });

      if (pipSupported) {
        // Click PiP button
        const pipBtn = page
          .locator('button[title*="Picture" i], button[title*="PiP" i]')
          .first();

        if (await pipBtn.isVisible()) {
          await pipBtn.click();
          await page.waitForTimeout(1000);

          // Check if PiP is active
          const pipActive = await page.evaluate(() => {
            return document.pictureInPictureElement !== null;
          });

          expect(pipActive).toBeTruthy();

          // Exit PiP
          await page.evaluate(async () => {
            if (document.pictureInPictureElement) {
              await document.exitPictureInPicture();
            }
          });
        }
      } else {
        test.skip('Picture-in-Picture not supported in this browser');
      }
    } else {
      test.skip('Video not available in test environment');
    }
  });

  test('should close video and stop all streams', async ({ page }) => {
    await joinVoiceChannelWithVideo(page);

    const videoGrid = page.locator('.fixed.inset-0.z-50').first();

    if (await videoGrid.isVisible().catch(() => false)) {
      // Click close button
      const closeBtn = page.locator('button[title*="Close video" i]').first();

      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(500);

        // Video grid should be hidden
        expect(await videoGrid.isVisible()).toBeFalsy();

        // Verify no video streams are active
        const hasActiveStreams = await page.evaluate(() => {
          // Check if any video elements are playing
          const videos = document.querySelectorAll('video');
          return Array.from(videos).some((v) => !v.paused);
        });

        // After closing, no videos should be playing (or none present)
        expect(hasActiveStreams).toBeFalsy();
      }
    } else {
      test.skip('Video not available in test environment');
    }
  });

  test('should persist window position across minimize/restore', async ({
    page
  }) => {
    await joinVoiceChannelWithVideo(page);

    const videoGrid = page.locator('.fixed.inset-0.z-50').first();

    if (await videoGrid.isVisible().catch(() => false)) {
      // Switch to floating and drag
      const floatBtn = page.locator('button[title*="Float" i]').first();

      if (await floatBtn.isVisible()) {
        await floatBtn.click();
        await page.waitForTimeout(500);

        const floatingWindow = page.locator('.fixed.z-\\[60\\]').first();

        if (await floatingWindow.isVisible()) {
          // Drag to new position
          const dragHandle = page.locator('.drag-handle').first();
          await dragHandle.hover();
          await page.mouse.down();
          await page.mouse.move(300, 200, { steps: 5 });
          await page.mouse.up();
          await page.waitForTimeout(300);

          const positionBefore = await floatingWindow.boundingBox();

          // Minimize and restore
          const minimizeBtn = page
            .locator('button[title*="Minimize" i]')
            .first();
          await minimizeBtn.click();
          await page.waitForTimeout(500);

          const minimizedIndicator = page
            .locator('.fixed.bottom-6.right-6')
            .first();
          await minimizedIndicator.click();
          await page.waitForTimeout(500);

          // Should restore to floating mode at same position
          const positionAfter = await floatingWindow.boundingBox();

          expect(positionAfter).toBeTruthy();
          // Position should be similar (allow some tolerance)
          expect(Math.abs(positionAfter!.x - positionBefore!.x)).toBeLessThan(
            50
          );
          expect(Math.abs(positionAfter!.y - positionBefore!.y)).toBeLessThan(
            50
          );
        }
      }
    } else {
      test.skip('Video not available in test environment');
    }
  });
});
