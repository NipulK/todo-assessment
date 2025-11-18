import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import TodoApp from './TodoApp.vue';

// Mock fetch globally
global.fetch = vi.fn();

describe('TodoApp.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the app header', () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      expect(wrapper.find('h1').text()).toContain('My Tasks');
      expect(wrapper.find('.subtitle').text()).toContain('Stay organized and get things done');
    });

    it('should render task form with inputs and button', () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      expect(wrapper.find('input[placeholder="Task title"]').exists()).toBe(true);
      expect(wrapper.find('input[placeholder="Description (optional)"]').exists()).toBe(true);
      expect(wrapper.find('button[type="submit"]').text()).toContain('Add Task');
    });

    it('should show empty state when no tasks', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      expect(wrapper.find('.empty-state').exists()).toBe(true);
      expect(wrapper.text()).toContain('No tasks yet');
      expect(wrapper.text()).toContain('Add your first task to get started!');
    });

    it('should show loading state initially', () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {}));

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      expect(wrapper.find('.spinner').exists()).toBe(true);
      expect(wrapper.text()).toContain('Loading tasks...');
    });
  });

  describe('Loading Tasks', () => {
    it('should load tasks on mount', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', description: 'Desc 1', createdAt: new Date().toISOString(), completed: false },
        { id: 2, title: 'Task 2', description: null, createdAt: new Date().toISOString(), completed: false }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks
      });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/tasks');
      expect(wrapper.findAll('.task-item')).toHaveLength(2);
    });

    it('should display task details correctly', async () => {
      const mockTasks = [
        { 
          id: 1, 
          title: 'Test Task', 
          description: 'Test Description', 
          createdAt: new Date().toISOString(), 
          completed: false 
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks
      });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      expect(wrapper.find('.task-title').text()).toBe('Test Task');
      expect(wrapper.find('.task-description').text()).toBe('Test Description');
    });

    it('should handle tasks without description', async () => {
      const mockTasks = [
        { 
          id: 1, 
          title: 'Task without description', 
          description: null, 
          createdAt: new Date().toISOString(), 
          completed: false 
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks
      });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      expect(wrapper.find('.task-title').text()).toBe('Task without description');
      expect(wrapper.find('.task-description').exists()).toBe(false);
    });

    it('should show error message when loading fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false
      });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      expect(wrapper.find('.error-message').exists()).toBe(true);
      expect(wrapper.find('.error-message').text()).toContain('Failed to load tasks');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      expect(wrapper.find('.error-message').exists()).toBe(true);
      expect(wrapper.find('.error-message').text()).toContain('Failed to load tasks');
    });
  });

  describe('Creating Tasks', () => {
    it('should create task with title only', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Initial load
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, title: 'New Task' }) }) // Create
        .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1, title: 'New Task', description: null, createdAt: new Date().toISOString(), completed: false }] }); // Reload

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      await wrapper.find('input[placeholder="Task title"]').setValue('New Task');
      await wrapper.find('form').trigger('submit.prevent');
      await flushPromises();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/tasks',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'New Task', description: undefined })
        })
      );
    });

    it('should create task with title and description', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      await wrapper.find('input[placeholder="Task title"]').setValue('Task Title');
      await wrapper.find('input[placeholder="Description (optional)"]').setValue('Task Description');
      await wrapper.find('form').trigger('submit.prevent');
      await flushPromises();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/tasks',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'Task Title', description: 'Task Description' })
        })
      );
    });

    it('should clear form inputs after successful creation', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      const titleInput = wrapper.find('input[placeholder="Task title"]');
      const descInput = wrapper.find('input[placeholder="Description (optional)"]');

      await titleInput.setValue('Task Title');
      await descInput.setValue('Task Description');
      await wrapper.find('form').trigger('submit.prevent');
      await flushPromises();

      expect((titleInput.element as HTMLInputElement).value).toBe('');
      expect((descInput.element as HTMLInputElement).value).toBe('');
    });

    it('should reload tasks after creating new task', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) })
        .mockResolvedValueOnce({ 
          ok: true, 
          json: async () => [{ 
            id: 1, 
            title: 'New Task', 
            description: null, 
            createdAt: new Date().toISOString(), 
            completed: false 
          }] 
        });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      await wrapper.find('input[placeholder="Task title"]').setValue('New Task');
      await wrapper.find('form').trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.findAll('.task-item')).toHaveLength(1);
    });

    it('should show error when creation fails', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: false });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      await wrapper.find('input[placeholder="Task title"]').setValue('Task');
      await wrapper.find('form').trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.find('.error-message').exists()).toBe(true);
      expect(wrapper.find('.error-message').text()).toContain('Failed to create task');
    });

    it('should not submit form with empty title', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => [] });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      const button = wrapper.find('button[type="submit"]');
      expect((button.element as HTMLButtonElement).disabled).toBe(true);
    });

    it('should trim whitespace from title and description', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      await wrapper.find('input[placeholder="Task title"]').setValue('  Task Title  ');
      await wrapper.find('input[placeholder="Description (optional)"]').setValue('  Description  ');
      await wrapper.find('form').trigger('submit.prevent');
      await flushPromises();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/tasks',
        expect.objectContaining({
          body: JSON.stringify({ title: 'Task Title', description: 'Description' })
        })
      );
    });

    it('should send undefined for empty description', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      await wrapper.find('input[placeholder="Task title"]').setValue('Task');
      await wrapper.find('input[placeholder="Description (optional)"]').setValue('   ');
      await wrapper.find('form').trigger('submit.prevent');
      await flushPromises();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/tasks',
        expect.objectContaining({
          body: JSON.stringify({ title: 'Task', description: undefined })
        })
      );
    });
  });

  describe('Completing Tasks', () => {
    it('should mark task as done', async () => {
      const mockTask = { 
        id: 1, 
        title: 'Task to complete', 
        description: 'Description', 
        createdAt: new Date().toISOString(), 
        completed: false 
      };

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [mockTask] })
        .mockResolvedValueOnce({ ok: true }) // Mark done
        .mockResolvedValueOnce({ ok: true, json: async () => [] }); // Reload

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      await wrapper.find('.btn-complete').trigger('click');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/tasks/1/done',
        { method: 'POST' }
      );
    });

    it('should reload tasks after marking as done', async () => {
      const mockTask = { 
        id: 1, 
        title: 'Task to complete', 
        description: null, 
        createdAt: new Date().toISOString(), 
        completed: false 
      };

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [mockTask] })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();
      
      expect(wrapper.findAll('.task-item')).toHaveLength(1);

      await wrapper.find('.btn-complete').trigger('click');

      // Wait for animation delay
      await new Promise(resolve => setTimeout(resolve, 400));
      await flushPromises();

      expect(wrapper.findAll('.task-item')).toHaveLength(0);
    });

    it('should disable button while completing', async () => {
      const mockTask = { 
        id: 1, 
        title: 'Task', 
        description: null, 
        createdAt: new Date().toISOString(), 
        completed: false 
      };

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [mockTask] })
        .mockImplementation(() => new Promise(() => {})); // Never resolves

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      const button = wrapper.find('.btn-complete');
      await button.trigger('click');

      expect((button.element as HTMLButtonElement).disabled).toBe(true);
      expect(button.text()).toContain('Completing...');
    });

    it('should show error when marking as done fails', async () => {
      const mockTask = { 
        id: 1, 
        title: 'Task', 
        description: null, 
        createdAt: new Date().toISOString(), 
        completed: false 
      };

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [mockTask] })
        .mockResolvedValueOnce({ ok: false });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      await wrapper.find('.btn-complete').trigger('click');
      await flushPromises();

      expect(wrapper.find('.error-message').exists()).toBe(true);
      expect(wrapper.find('.error-message').text()).toContain('Failed to complete task');
    });

    it('should re-enable button if completion fails', async () => {
      const mockTask = { 
        id: 1, 
        title: 'Task', 
        description: null, 
        createdAt: new Date().toISOString(), 
        completed: false 
      };

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [mockTask] })
        .mockRejectedValueOnce(new Error('Network error'));

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      const button = wrapper.find('.btn-complete');
      await button.trigger('click');
      await flushPromises();

      expect((button.element as HTMLButtonElement).disabled).toBe(false);
    });
  });

  describe('Date Formatting', () => {
    it('should format recent dates correctly', async () => {
      const now = new Date();
      const mockTasks = [
        { id: 1, title: 'Just now', description: null, createdAt: now.toISOString(), completed: false },
        { id: 2, title: '5 min ago', description: null, createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), completed: false },
        { id: 3, title: '2 hours ago', description: null, createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), completed: false },
        { id: 4, title: '3 days ago', description: null, createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), completed: false }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks
      });

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();

      const dates = wrapper.findAll('.task-date');
      expect(dates[0].text()).toContain('Just now');
      expect(dates[1].text()).toContain('5m ago');
      expect(dates[2].text()).toContain('2h ago');
      expect(dates[3].text()).toContain('3d ago');
    });
  });

  describe('Props and Configuration', () => {
    it('should use custom API URL from props', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      mount(TodoApp, {
        props: { apiUrl: 'http://custom-api:8080' }
      });

      await flushPromises();

      expect(global.fetch).toHaveBeenCalledWith('http://custom-api:8080/tasks');
    });

    it('should use default API URL if not provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      mount(TodoApp);

      await flushPromises();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/tasks');
    });
  });

  describe('UI State Management', () => {
    it('should disable inputs while loading', async () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {}));

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      const titleInput = wrapper.find('input[placeholder="Task title"]');
      const descInput = wrapper.find('input[placeholder="Description (optional)"]');
      const button = wrapper.find('button[type="submit"]');

      expect((titleInput.element as HTMLInputElement).disabled).toBe(true);
      expect((descInput.element as HTMLInputElement).disabled).toBe(true);
      expect((button.element as HTMLButtonElement).disabled).toBe(true);
    });

    it('should clear error message on successful operation', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: false }) // Initial load fails
        .mockResolvedValueOnce({ ok: true, json: async () => [] }); // Retry succeeds

      const wrapper = mount(TodoApp, {
        props: { apiUrl: 'http://localhost:4000' }
      });

      await flushPromises();
      expect(wrapper.find('.error-message').exists()).toBe(true);

      // Create task successfully
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) })
        .mockResolvedValueOnce({ ok: true, json: async () => [] });

      await wrapper.find('input[placeholder="Task title"]').setValue('New Task');
      await wrapper.find('form').trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.find('.error-message').exists()).toBe(false);
    });
  });
});
