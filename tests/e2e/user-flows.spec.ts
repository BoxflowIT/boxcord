import { test, expect } from '@playwright/test';

test.describe('User Login Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for login page to load
    await expect(page).toHaveTitle(/Boxcord/);

    // Fill login form (adjust selectors based on your UI)
    await page.fill('[name="email"]', 'test@boxflow.com');
    await page.fill('[name="password"]', 'testpassword');

    // Click login button
    await page.click('button[type="submit"]');

    // Verify successful login - should redirect to chat
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.locator('[data-testid="workspace-list"]')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/');

    await page.fill('[name="email"]', 'invalid@test.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('[role="alert"]')).toContainText(/invalid/i);
  });
});

test.describe('Send Message Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    // Add your login logic here
  });

  test('should send a message in channel', async ({ page }) => {
    // Navigate to a channel
    await page.click('[data-testid="channel-general"]');

    // Type message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Test message from E2E test');

    // Send message
    await messageInput.press('Enter');

    // Verify message appears
    await expect(page.locator('[data-testid="message-list"]')).toContainText(
      'Test message from E2E test'
    );
  });

  test('should edit a message', async ({ page }) => {
    // Send a message first
    await page.click('[data-testid="channel-general"]');
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Original message');
    await messageInput.press('Enter');

    // Wait for message to appear
    await page.waitForSelector('text=Original message');

    // Click edit (adjust selector based on your UI)
    await page.hover('text=Original message');
    await page.click('[data-testid="edit-message-button"]');

    // Edit message
    const editInput = page.locator('[data-testid="edit-message-input"]');
    await editInput.fill('Edited message');
    await editInput.press('Enter');

    // Verify edit
    await expect(page.locator('[data-testid="message-list"]')).toContainText(
      'Edited message'
    );
    await expect(page.locator('[data-testid="message-list"]')).toContainText(
      '(edited)'
    );
  });
});

test.describe('Create Channel Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Add login logic
  });

  test('should create a new channel', async ({ page }) => {
    // Click create channel button
    await page.click('[data-testid="create-channel-button"]');

    // Fill channel form
    await page.fill('[name="name"]', 'test-e2e-channel');
    await page.fill('[name="description"]', 'E2E test channel');

    // Submit
    await page.click('button[type="submit"]');

    // Verify channel appears in sidebar
    await expect(page.locator('[data-testid="channel-list"]')).toContainText(
      'test-e2e-channel'
    );
  });
});
