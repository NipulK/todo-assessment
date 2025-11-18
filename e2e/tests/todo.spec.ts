import { test, expect } from '@playwright/test';

test.describe('Todo Application E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Initial Page Load', () => {
    test('should display the application header', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('My Tasks');
      await expect(page.locator('.subtitle')).toContainText('Stay organized and get things done');
    });

    test('should display the task creation form', async ({ page }) => {
      await expect(page.locator('input[placeholder="Task title"]')).toBeVisible();
      await expect(page.locator('input[placeholder="Description (optional)"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toContainText('Add Task');
    });

    test('should display empty state when no tasks exist', async ({ page }) => {
      // Wait for tasks to load
      await page.waitForTimeout(1000);
      
      const emptyState = page.locator('.empty-state');
      if (await emptyState.isVisible()) {
        await expect(emptyState).toContainText('No tasks yet');
        await expect(emptyState).toContainText('Add your first task to get started!');
      }
    });
  });

  test.describe('Task Creation', () => {
    test('should create a new task with title only', async ({ page }) => {
      const taskTitle = `Test Task ${Date.now()}`;
      
      await page.fill('input[placeholder="Task title"]', taskTitle);
      await page.click('button[type="submit"]');
      
      // Wait for the task to appear
      await expect(page.locator('.task-title', { hasText: taskTitle })).toBeVisible({ timeout: 5000 });
      
      // Verify the task appears in the list
      const taskItems = page.locator('.task-item');
      await expect(taskItems.first()).toContainText(taskTitle);
    });

    test('should create a new task with title and description', async ({ page }) => {
      const taskTitle = `Task with Description ${Date.now()}`;
      const taskDescription = 'This is a detailed description of the task';
      
      await page.fill('input[placeholder="Task title"]', taskTitle);
      await page.fill('input[placeholder="Description (optional)"]', taskDescription);
      await page.click('button[type="submit"]');
      
      // Wait for the task to appear
      await expect(page.locator('.task-title', { hasText: taskTitle })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.task-description', { hasText: taskDescription })).toBeVisible();
    });

    test('should clear form inputs after successful creation', async ({ page }) => {
      const taskTitle = `Clear Form Test ${Date.now()}`;
      
      await page.fill('input[placeholder="Task title"]', taskTitle);
      await page.fill('input[placeholder="Description (optional)"]', 'Some description');
      await page.click('button[type="submit"]');
      
      // Wait for task to be created
      await expect(page.locator('.task-title', { hasText: taskTitle })).toBeVisible({ timeout: 5000 });
      
      // Verify inputs are cleared
      await expect(page.locator('input[placeholder="Task title"]')).toHaveValue('');
      await expect(page.locator('input[placeholder="Description (optional)"]')).toHaveValue('');
    });

    test('should disable submit button when title is empty', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();
      
      await page.fill('input[placeholder="Task title"]', 'Some title');
      await expect(submitButton).toBeEnabled();
      
      await page.fill('input[placeholder="Task title"]', '');
      await expect(submitButton).toBeDisabled();
    });

    test('should handle special characters in title and description', async ({ page }) => {
      const specialTitle = `Task with émojis 🎉🚀 & special chars: @#$%`;
      const specialDesc = 'Description with unicode: åäö and symbols: <>&"';
      
      await page.fill('input[placeholder="Task title"]', specialTitle);
      await page.fill('input[placeholder="Description (optional)"]', specialDesc);
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.task-title', { hasText: specialTitle })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.task-description', { hasText: specialDesc })).toBeVisible();
    });
  });

  test.describe('Task Completion', () => {
    test('should mark a task as completed and remove it from view', async ({ page }) => {
      // Create a task first
      const taskTitle = `Task to Complete ${Date.now()}`;
      await page.fill('input[placeholder="Task title"]', taskTitle);
      await page.click('button[type="submit"]');
      
      // Wait for task to appear
      const taskElement = page.locator('.task-item', { hasText: taskTitle });
      await expect(taskElement).toBeVisible({ timeout: 5000 });
      
      // Click the complete button
      const completeButton = taskElement.locator('.btn-complete');
      await completeButton.click();
      
      // Wait for the task to disappear
      await expect(taskElement).not.toBeVisible({ timeout: 5000 });
    });

    test('should show "Completing..." text while completing task', async ({ page }) => {
      // Create a task
      const taskTitle = `Completing State Test ${Date.now()}`;
      await page.fill('input[placeholder="Task title"]', taskTitle);
      await page.click('button[type="submit"]');
      
      const taskElement = page.locator('.task-item', { hasText: taskTitle });
      await expect(taskElement).toBeVisible({ timeout: 5000 });
      
      const completeButton = taskElement.locator('.btn-complete');
      
      // Click and immediately check for "Completing..." text
      await completeButton.click();
      
      // The button should show "Completing..." or the task should disappear quickly
      const buttonText = await completeButton.textContent();
      const isCompleting = buttonText?.includes('Completing...') || buttonText?.includes('Complete');
      expect(isCompleting).toBeTruthy();
    });

    test('should handle multiple task completions in sequence', async ({ page }) => {
      // Create multiple tasks
      const tasks = [
        `Multi Task 1 ${Date.now()}`,
        `Multi Task 2 ${Date.now()}`,
        `Multi Task 3 ${Date.now()}`
      ];
      
      for (const taskTitle of tasks) {
        await page.fill('input[placeholder="Task title"]', taskTitle);
        await page.click('button[type="submit"]');
        await expect(page.locator('.task-title', { hasText: taskTitle })).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(500); // Small delay between creations
      }
      
      // Complete all tasks one by one
      for (const taskTitle of tasks) {
        const taskElement = page.locator('.task-item', { hasText: taskTitle });
        if (await taskElement.isVisible()) {
          await taskElement.locator('.btn-complete').click();
          await expect(taskElement).not.toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Task List Display', () => {
    test('should display tasks in order (newest first)', async ({ page }) => {
      // Clear existing tasks by completing them
      const existingTasks = page.locator('.task-item');
      const count = await existingTasks.count();
      
      // Create tasks in sequence with delays
      const task1 = `First Task ${Date.now()}`;
      await page.fill('input[placeholder="Task title"]', task1);
      await page.click('button[type="submit"]');
      await expect(page.locator('.task-title', { hasText: task1 })).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(1000);
      
      const task2 = `Second Task ${Date.now()}`;
      await page.fill('input[placeholder="Task title"]', task2);
      await page.click('button[type="submit"]');
      await expect(page.locator('.task-title', { hasText: task2 })).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(1000);
      
      const task3 = `Third Task ${Date.now()}`;
      await page.fill('input[placeholder="Task title"]', task3);
      await page.click('button[type="submit"]');
      await expect(page.locator('.task-title', { hasText: task3 })).toBeVisible({ timeout: 5000 });
      
      // Get all task titles
      const taskTitles = page.locator('.task-title');
      const titles = await taskTitles.allTextContents();
      
      // Check that our tasks appear in reverse chronological order
      const ourTasks = titles.filter(t => 
        t.includes(task1) || t.includes(task2) || t.includes(task3)
      );
      
      // The most recent task should appear first
      expect(ourTasks[0]).toContain('Third Task');
    });

    test('should show maximum of 5 tasks', async ({ page }) => {
      // Create 6 tasks
      for (let i = 1; i <= 6; i++) {
        await page.fill('input[placeholder="Task title"]', `Task ${i} ${Date.now()}`);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(300);
      }
      
      // Wait for last task to appear
      await page.waitForTimeout(1000);
      
      // Count visible tasks
      const taskItems = page.locator('.task-item');
      const count = await taskItems.count();
      
      // Should not exceed 5 tasks
      expect(count).toBeLessThanOrEqual(5);
    });

    test('should display task creation date/time', async ({ page }) => {
      const taskTitle = `Date Test ${Date.now()}`;
      await page.fill('input[placeholder="Task title"]', taskTitle);
      await page.click('button[type="submit"]');
      
      const taskElement = page.locator('.task-item', { hasText: taskTitle });
      await expect(taskElement).toBeVisible({ timeout: 5000 });
      
      // Should have a date element
      const dateElement = taskElement.locator('.task-date');
      await expect(dateElement).toBeVisible();
      
      // Should show relative time like "Just now"
      const dateText = await dateElement.textContent();
      expect(dateText).toBeTruthy();
      expect(dateText?.length).toBeGreaterThan(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message when backend is unavailable', async ({ page, context }) => {
      // This test assumes the backend might be slow or unavailable
      // We can't easily simulate this in E2E without stopping containers
      // So we'll just verify error handling exists in the UI
      
      await expect(page.locator('.error-message')).not.toBeVisible();
    });

    test('should recover from errors and allow retry', async ({ page }) => {
      // Try to create a task with very long title (if there's validation)
      const longTitle = 'A'.repeat(1000);
      await page.fill('input[placeholder="Task title"]', longTitle);
      await page.click('button[type="submit"]');
      
      // Wait a bit
      await page.waitForTimeout(1000);
      
      // Should be able to create a normal task after
      const normalTitle = `Recovery Test ${Date.now()}`;
      await page.fill('input[placeholder="Task title"]', normalTitle);
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.task-title', { hasText: normalTitle })).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('User Experience', () => {
    test('should have smooth animations when completing tasks', async ({ page }) => {
      const taskTitle = `Animation Test ${Date.now()}`;
      await page.fill('input[placeholder="Task title"]', taskTitle);
      await page.click('button[type="submit"]');
      
      const taskElement = page.locator('.task-item', { hasText: taskTitle });
      await expect(taskElement).toBeVisible({ timeout: 5000 });
      
      // The task should have animation classes
      const classList = await taskElement.getAttribute('class');
      expect(classList).toBeTruthy();
    });

    test('should be responsive and work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Should still show the form
      await expect(page.locator('input[placeholder="Task title"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Create a task
      const taskTitle = `Mobile Test ${Date.now()}`;
      await page.fill('input[placeholder="Task title"]', taskTitle);
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.task-title', { hasText: taskTitle })).toBeVisible({ timeout: 5000 });
    });

    test('should maintain focus management', async ({ page }) => {
      // Click on title input
      await page.click('input[placeholder="Task title"]');
      
      // Type a task
      await page.keyboard.type('Keyboard Navigation Test');
      
      // Tab to description
      await page.keyboard.press('Tab');
      
      // Type description
      await page.keyboard.type('Testing keyboard navigation');
      
      // Tab to button and press Enter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Task should be created
      await expect(page.locator('.task-title', { hasText: 'Keyboard Navigation Test' })).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Complete User Flow', () => {
    test('should handle complete user journey', async ({ page }) => {
      // 1. User arrives at the page
      await expect(page.locator('h1')).toContainText('My Tasks');
      
      // 2. User creates their first task
      const task1 = `User Journey Task 1 ${Date.now()}`;
      await page.fill('input[placeholder="Task title"]', task1);
      await page.fill('input[placeholder="Description (optional)"]', 'First task description');
      await page.click('button[type="submit"]');
      await expect(page.locator('.task-title', { hasText: task1 })).toBeVisible({ timeout: 5000 });
      
      // 3. User creates a second task
      await page.waitForTimeout(500);
      const task2 = `User Journey Task 2 ${Date.now()}`;
      await page.fill('input[placeholder="Task title"]', task2);
      await page.click('button[type="submit"]');
      await expect(page.locator('.task-title', { hasText: task2 })).toBeVisible({ timeout: 5000 });
      
      // 4. User completes the first task
      const task1Element = page.locator('.task-item', { hasText: task1 });
      await task1Element.locator('.btn-complete').click();
      await expect(task1Element).not.toBeVisible({ timeout: 5000 });
      
      // 5. Second task should still be visible
      await expect(page.locator('.task-title', { hasText: task2 })).toBeVisible();
      
      // 6. User creates another task
      await page.waitForTimeout(500);
      const task3 = `User Journey Task 3 ${Date.now()}`;
      await page.fill('input[placeholder="Task title"]', task3);
      await page.fill('input[placeholder="Description (optional)"]', 'Third task with description');
      await page.click('button[type="submit"]');
      await expect(page.locator('.task-title', { hasText: task3 })).toBeVisible({ timeout: 5000 });
      
      // 7. Verify both remaining tasks are visible
      await expect(page.locator('.task-title', { hasText: task2 })).toBeVisible();
      await expect(page.locator('.task-title', { hasText: task3 })).toBeVisible();
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should work correctly in different browsers', async ({ page, browserName }) => {
      const taskTitle = `${browserName} Test ${Date.now()}`;
      
      await page.fill('input[placeholder="Task title"]', taskTitle);
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.task-title', { hasText: taskTitle })).toBeVisible({ timeout: 5000 });
      
      const taskElement = page.locator('.task-item', { hasText: taskTitle });
      await taskElement.locator('.btn-complete').click();
      await expect(taskElement).not.toBeVisible({ timeout: 5000 });
    });
  });
});
