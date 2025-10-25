import { APP_CONFIG, STORAGE_KEYS } from './constants';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * AI Usage tracking interface
 */
export interface AIUsage {
  usage_count: number;
  daily_limit: number;
  remaining: number;
  last_used_at: string | null;
  session_id: string | null;
}

/**
 * Rate limiting service for AI usage
 */
export class RateLimitingService {
  private static instance: RateLimitingService;
  private guestSessionId: string | null = null;

  private constructor() {
    this.initializeGuestSession();
  }

  public static getInstance(): RateLimitingService {
    if (!RateLimitingService.instance) {
      RateLimitingService.instance = new RateLimitingService();
    }
    return RateLimitingService.instance;
  }

  /**
   * Initialize guest session for tracking
   */
  private initializeGuestSession(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.GUEST_USAGE);
      if (stored) {
        const usageData = JSON.parse(stored);
        // Check if it's a new day (reset if needed)
        const today = new Date().toDateString();
        if (usageData.date !== today) {
          this.resetGuestUsage();
        } else {
          this.guestSessionId = usageData.sessionId;
        }
      } else {
        this.resetGuestUsage();
      }
    }
  }

  /**
   * Reset guest usage for new day
   */
  private resetGuestUsage(): void {
    this.guestSessionId = crypto.randomUUID();
    const usageData = {
      sessionId: this.guestSessionId,
      date: new Date().toDateString(),
      count: 0,
      limit: APP_CONFIG.RATE_LIMITS.GUEST_DAILY_LIMIT
    };
    localStorage.setItem(STORAGE_KEYS.GUEST_USAGE, JSON.stringify(usageData));
  }

  /**
   * Check if user can make AI call
   */
  public async canMakeAICall(user: User | null): Promise<{
    allowed: boolean;
    usage: AIUsage;
    error?: string;
  }> {
    try {
      if (user) {
        // Authenticated user - check database
        return await this.checkAuthenticatedUserUsage(user.id);
      } else {
        // Guest user - check server-side validation
        return await this.checkGuestUsage();
      }
    } catch (error) {
      console.error('Error checking AI usage:', error);
      return {
        allowed: false,
        usage: this.getDefaultUsage(user),
        error: 'Failed to check usage limits'
      };
    }
  }

  /**
   * Increment AI usage counter
   */
  public async incrementUsage(user: User | null): Promise<{
    success: boolean;
    usage: AIUsage;
    error?: string;
  }> {
    try {
      if (user) {
        // Authenticated user - update database
        return await this.incrementAuthenticatedUserUsage(user.id);
      } else {
        // Guest user - update server-side validation
        return await this.incrementGuestUsage();
      }
    } catch (error) {
      console.error('Error incrementing AI usage:', error);
      return {
        success: false,
        usage: this.getDefaultUsage(user),
        error: 'Failed to update usage'
      };
    }
  }

  /**
   * Check authenticated user usage from database
   */
  private async checkAuthenticatedUserUsage(userId: string): Promise<{
    allowed: boolean;
    usage: AIUsage;
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('get_current_usage', {
      p_user_id: userId,
      p_is_guest: false,
      p_session_id: null
    });

    if (error) throw error;

    const usage: AIUsage = {
      usage_count: data.usage_count || 0,
      daily_limit: APP_CONFIG.RATE_LIMITS.AUTH_DAILY_LIMIT,
      remaining: data.remaining || APP_CONFIG.RATE_LIMITS.AUTH_DAILY_LIMIT,
      last_used_at: data.last_used_at,
      session_id: data.session_id
    };

    return {
      allowed: usage.remaining > 0,
      usage
    };
  }

  /**
   * Increment authenticated user usage in database
   */
  private async incrementAuthenticatedUserUsage(userId: string): Promise<{
    success: boolean;
    usage: AIUsage;
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('increment_ai_usage', {
      p_user_id: userId,
      p_is_guest: false,
      p_session_id: null
    });

    if (error) throw error;

    if (!data.success) {
      return {
        success: false,
        usage: {
          usage_count: data.usage_count || 0,
          daily_limit: data.daily_limit || APP_CONFIG.RATE_LIMITS.AUTH_DAILY_LIMIT,
          remaining: data.remaining || 0,
          last_used_at: null,
          session_id: null
        },
        error: data.error || 'Usage limit exceeded'
      };
    }

    return {
      success: true,
      usage: {
        usage_count: data.usage_count,
        daily_limit: data.daily_limit,
        remaining: data.remaining,
        last_used_at: null,
        session_id: null
      }
    };
  }

  /**
   * Check guest user usage from server-side validation
   */
  private async checkGuestUsage(): Promise<{
    allowed: boolean;
    usage: AIUsage;
    error?: string;
  }> {
    try {
      // Get client info for tracking
      const ipAddress = await this.getClientIP();
      const userAgent = navigator.userAgent;
      
      // Use server-side validation
      const { data, error } = await supabase.rpc('track_guest_usage', {
        p_session_id: this.guestSessionId || crypto.randomUUID(),
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) throw error;

      return {
        allowed: data.success,
        usage: {
          usage_count: data.usage_count,
          daily_limit: data.daily_limit,
          remaining: data.remaining,
          last_used_at: null,
          session_id: this.guestSessionId
        },
        error: data.success ? undefined : 'Daily limit exceeded'
      };
    } catch (error) {
      console.error('Error checking guest usage:', error);
      // Fallback to localStorage if server fails
      return this.checkGuestUsageFallback();
    }
  }

  /**
   * Fallback guest usage check from localStorage
   */
  private checkGuestUsageFallback(): {
    allowed: boolean;
    usage: AIUsage;
    error?: string;
  } {
    const stored = localStorage.getItem(STORAGE_KEYS.GUEST_USAGE);
    if (!stored) {
      this.resetGuestUsage();
      return {
        allowed: true,
        usage: {
          usage_count: 0,
          daily_limit: APP_CONFIG.RATE_LIMITS.GUEST_DAILY_LIMIT,
          remaining: APP_CONFIG.RATE_LIMITS.GUEST_DAILY_LIMIT,
          last_used_at: null,
          session_id: this.guestSessionId
        }
      };
    }

    const usageData = JSON.parse(stored);
    const remaining = usageData.limit - usageData.count;

    return {
      allowed: remaining > 0,
      usage: {
        usage_count: usageData.count,
        daily_limit: usageData.limit,
        remaining: remaining,
        last_used_at: usageData.lastUsedAt || null,
        session_id: usageData.sessionId
      }
    };
  }

  /**
   * Increment guest user usage with server-side validation
   */
  private async incrementGuestUsage(): Promise<{
    success: boolean;
    usage: AIUsage;
    error?: string;
  }> {
    try {
      // Get client info for tracking
      const ipAddress = await this.getClientIP();
      const userAgent = navigator.userAgent;
      
      // Use server-side validation and increment
      const { data, error } = await supabase.rpc('track_guest_usage', {
        p_session_id: this.guestSessionId || crypto.randomUUID(),
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) throw error;

      return {
        success: data.success,
        usage: {
          usage_count: data.usage_count,
          daily_limit: data.daily_limit,
          remaining: data.remaining,
          last_used_at: null,
          session_id: this.guestSessionId
        },
        error: data.success ? undefined : 'Daily limit exceeded'
      };
    } catch (error) {
      console.error('Error incrementing guest usage:', error);
      // Fallback to localStorage if server fails
      return this.incrementGuestUsageFallback();
    }
  }

  /**
   * Fallback guest usage increment from localStorage
   */
  private incrementGuestUsageFallback(): {
    success: boolean;
    usage: AIUsage;
    error?: string;
  } {
    const stored = localStorage.getItem(STORAGE_KEYS.GUEST_USAGE);
    let usageData;

    if (stored) {
      usageData = JSON.parse(stored);

      // Check if it's a new day
      const today = new Date().toDateString();
      if (usageData.date !== today) {
        this.resetGuestUsage();
        usageData = JSON.parse(localStorage.getItem(STORAGE_KEYS.GUEST_USAGE) || '{}');
      }
    } else {
      this.resetGuestUsage();
      usageData = JSON.parse(localStorage.getItem(STORAGE_KEYS.GUEST_USAGE) || '{}');
    }

    if (usageData.count >= usageData.limit) {
      return {
        success: false,
        usage: {
          usage_count: usageData.count,
          daily_limit: usageData.limit,
          remaining: 0,
          last_used_at: usageData.lastUsedAt || null,
          session_id: usageData.sessionId
        },
        error: 'Daily limit exceeded'
      };
    }

    // Increment count
    usageData.count += 1;
    usageData.lastUsedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.GUEST_USAGE, JSON.stringify(usageData));

    return {
      success: true,
      usage: {
        usage_count: usageData.count,
        daily_limit: usageData.limit,
        remaining: usageData.limit - usageData.count,
        last_used_at: usageData.lastUsedAt,
        session_id: usageData.sessionId
      }
    };
  }

  /**
   * Get client IP address (simplified for browser environment)
   */
  private async getClientIP(): Promise<string | null> {
    try {
      // In browser environment, we can't directly get real IP
      // This is a simplified approach - in production, you might want to
      // use a service like ipify.org or get it from server headers
      return 'browser-client';
    } catch (error) {
      console.error('Error getting client IP:', error);
      return null;
    }
  }

  /**
   * Get default usage info based on user type
   */
  private getDefaultUsage(user: User | null): AIUsage {
    return {
      usage_count: 0,
      daily_limit: user
        ? APP_CONFIG.RATE_LIMITS.AUTH_DAILY_LIMIT
        : APP_CONFIG.RATE_LIMITS.GUEST_DAILY_LIMIT,
      remaining: user
        ? APP_CONFIG.RATE_LIMITS.AUTH_DAILY_LIMIT
        : APP_CONFIG.RATE_LIMITS.GUEST_DAILY_LIMIT,
      last_used_at: null,
      session_id: null
    };
  }


  /**
   * Reset usage (for testing purposes)
   */
  public async resetUsage(user: User | null): Promise<void> {
    if (user) {
      // For authenticated users, delete today's usage record
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('ai_usage')
        .delete()
        .eq('user_id', user.id)
        .eq('usage_date', today);
    } else {
      // For guest users, reset localStorage
      this.resetGuestUsage();
    }
  }
}

// Export singleton instance
export const rateLimitingService = RateLimitingService.getInstance();
