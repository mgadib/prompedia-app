import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase at the top level
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

// Mock logger first
vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    storage: vi.fn(),
    auth: vi.fn(),
    supabase: vi.fn(),
  },
  supabaseLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  storageLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { StorageManager, StorageError, storageManager } from './storage-manager';
import { Prompt } from './storage';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('StorageManager', () => {
  const mockPrompt: Prompt = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test Prompt',
    content: 'Test content',
    description: 'Test description',
    tags: ['test'],
    model: 'gpt-4',
    mode: 'normal',
    color: '#ff0000',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
  });

  describe('Basic Operations', () => {
    it('should save prompt to localStorage when not authenticated', async () => {
      mockLocalStorage.getItem.mockReturnValue('[]');
      
      await storageManager.savePrompt(mockPrompt);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'prompts',
        JSON.stringify([mockPrompt])
      );
    });

    it('should get prompts from localStorage when not authenticated', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockPrompt]));
      
      const prompts = await storageManager.getPrompts();
      
      expect(prompts).toEqual([mockPrompt]);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('prompts');
    });

    it('should delete prompt from localStorage when not authenticated', async () => {
      const existingPrompts = [mockPrompt, { ...mockPrompt, id: 'other-prompt' }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingPrompts));
      
      await storageManager.deletePrompt(mockPrompt.id);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'prompts',
        JSON.stringify([{ ...mockPrompt, id: 'other-prompt' }])
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage quota exceeded', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      await expect(storageManager.savePrompt(mockPrompt)).rejects.toThrow('Gagal menyimpan prompt');
    });

    it('should handle validation errors', async () => {
      const invalidPrompt = { ...mockPrompt, id: 'invalid-id', mode: 'invalid-mode' };
      
      await expect(storageManager.savePrompt(invalidPrompt as any)).rejects.toThrow();
    });
  });

  describe('Storage Status', () => {
    it('should return storage status', async () => {
      const status = storageManager.getStorageStatus();
      
      expect(status).toHaveProperty('isAuthenticated');
      expect(status).toHaveProperty('userId');
      expect(status).toHaveProperty('localStorageCapacity');
      expect(status).toHaveProperty('supabaseConnected');
    });

    it('should calculate localStorage capacity', async () => {
      mockLocalStorage.length = 1;
      mockLocalStorage.key.mockReturnValue('prompts');
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockPrompt]));
      
      const status = storageManager.getStorageStatus();
      
      expect(status.localStorageCapacity).toHaveProperty('used');
      expect(status.localStorageCapacity).toHaveProperty('available');
      expect(status.localStorageCapacity).toHaveProperty('total');
      expect(status.localStorageCapacity.total).toBe(status.localStorageCapacity.used + status.localStorageCapacity.available);
    });
  });
});