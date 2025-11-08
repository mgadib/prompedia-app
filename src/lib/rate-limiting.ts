import { APP_CONFIG, STORAGE_KEYS } from './constants';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * Interface untuk tracking penggunaan AI
 */
export interface AIUsage {
  usage_count: number;
  daily_limit: number;
  remaining: number;
  last_used_at: string | null;
  session_id: string | null;
}

/**
 * Service untuk membatasi penggunaan AI berdasarkan batas harian
 * Menggunakan singleton pattern untuk memastikan konsistensi state
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
   * Inisialisasi session untuk guest user
   * Mengecek apakah sudah ada data di localStorage dan melakukan reset jika sudah hari baru
   */
  private initializeGuestSession(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.GUEST_USAGE);
      if (stored) {
        const usageData = JSON.parse(stored);
        // Reset jika sudah hari baru untuk memastikan batas harian dihitung ulang
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
   * Reset penggunaan guest untuk hari baru
   * Membuat session ID baru dan mengatur ulang counter
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
   * Mengecek apakah user dapat melakukan panggilan AI
   * @param user - User yang terautentikasi atau null untuk guest
   * @returns Object berisi status allowed, usage info, dan error jika ada
   */
  public async canMakeAICall(user: User | null): Promise<{
    allowed: boolean;
    usage: AIUsage;
    error?: string;
  }> {
    try {
      if (user) {
        // User terautentikasi: cek dari database untuk akurasi yang lebih baik
        return await this.checkAuthenticatedUserUsage(user.id);
      } else {
        // Guest user: validasi di server-side untuk mencegah manipulasi client-side
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
   * Menambah counter penggunaan AI setelah panggilan berhasil
   * @param user - User yang terautentikasi atau null untuk guest
   * @returns Object berisi status success, usage info, dan error jika ada
   */
  public async incrementUsage(user: User | null): Promise<{
    success: boolean;
    usage: AIUsage;
    error?: string;
  }> {
    try {
      if (user) {
        // User terautentikasi: update di database untuk persistensi
        return await this.incrementAuthenticatedUserUsage(user.id);
      } else {
        // Guest user: update melalui server-side untuk validasi yang aman
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
   * Mengecek penggunaan user terautentikasi dari database
   * Menggunakan RPC function untuk mendapatkan data real-time
   */
  private async checkAuthenticatedUserUsage(userId: string): Promise<{
    allowed: boolean;
    usage: AIUsage;
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('get_current_usage' as any, {
      p_user_id: userId,
      p_is_guest: false,
      p_session_id: null
    }) as { data: any; error: any };

    if (error) throw error;
    if (!data) throw new Error('No data returned from get_current_usage');

    const usage: AIUsage = {
      usage_count: Number(data.usage_count) || 0,
      daily_limit: APP_CONFIG.RATE_LIMITS.AUTH_DAILY_LIMIT,
      remaining: Number(data.remaining) || APP_CONFIG.RATE_LIMITS.AUTH_DAILY_LIMIT,
      last_used_at: data.last_used_at || null,
      session_id: data.session_id || null
    };

    return {
      allowed: usage.remaining > 0,
      usage
    };
  }

  /**
   * Menambah penggunaan user terautentikasi di database
   * Menggunakan RPC function yang menangani reset harian otomatis
   */
  private async incrementAuthenticatedUserUsage(userId: string): Promise<{
    success: boolean;
    usage: AIUsage;
    error?: string;
  }> {
    const { data, error } = await supabase.rpc('increment_ai_usage' as any, {
      p_user_id: userId,
      p_is_guest: false,
      p_session_id: null
    }) as { data: any; error: any };

    if (error) throw error;
    if (!data) throw new Error('No data returned from increment_ai_usage');

    if (!data.success) {
      return {
        success: false,
        usage: {
          usage_count: Number(data.usage_count) || 0,
          daily_limit: Number(data.daily_limit) || APP_CONFIG.RATE_LIMITS.AUTH_DAILY_LIMIT,
          remaining: Number(data.remaining) || 0,
          last_used_at: null,
          session_id: null
        },
        error: String(data.error) || 'Usage limit reached'
      };
    }

    return {
      success: true,
      usage: {
        usage_count: Number(data.usage_count) || 0,
        daily_limit: Number(data.daily_limit) || APP_CONFIG.RATE_LIMITS.AUTH_DAILY_LIMIT,
        remaining: Number(data.remaining) || 0,
        last_used_at: null,
        session_id: null
      }
    };
  }

  /**
   * Mengecek penggunaan guest user melalui validasi server-side
   * Fallback ke localStorage jika server tidak tersedia
   */
  private async checkGuestUsage(): Promise<{
    allowed: boolean;
    usage: AIUsage;
    error?: string;
  }> {
    try {
      // Mengumpulkan info client untuk tracking dan validasi
      const ipAddress = await this.getClientIP();
      const userAgent = navigator.userAgent;
      
      // Validasi di server-side untuk mencegah manipulasi
      const { data, error } = await supabase.rpc('track_guest_usage' as any, {
        p_session_id: this.guestSessionId || crypto.randomUUID(),
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      }) as { data: any; error: any };

      if (error) throw error;
      if (!data) throw new Error('No data returned from track_guest_usage');

      return {
        allowed: Boolean(data.success),
        usage: {
          usage_count: Number(data.usage_count) || 0,
          daily_limit: Number(data.daily_limit) || APP_CONFIG.RATE_LIMITS.GUEST_DAILY_LIMIT,
          remaining: Number(data.remaining) || 0,
          last_used_at: null,
          session_id: this.guestSessionId
        },
        error: data.success ? undefined : 'Daily usage limit reached'
      };
    } catch (error) {
      console.error('Error checking guest usage:', error);
      // Fallback ke localStorage jika server tidak tersedia (untuk offline support)
      return this.checkGuestUsageFallback();
    }
  }

  /**
   * Fallback: cek penggunaan guest dari localStorage
   * Digunakan ketika server-side validation tidak tersedia
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
   * Menambah penggunaan guest user dengan validasi server-side
   * Fallback ke localStorage jika server tidak tersedia
   */
  private async incrementGuestUsage(): Promise<{
    success: boolean;
    usage: AIUsage;
    error?: string;
  }> {
    try {
      // Mengumpulkan info client untuk tracking
      const ipAddress = await this.getClientIP();
      const userAgent = navigator.userAgent;
      
      // Validasi dan increment di server-side untuk keamanan
      const { data, error } = await supabase.rpc('track_guest_usage' as any, {
        p_session_id: this.guestSessionId || crypto.randomUUID(),
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      }) as { data: any; error: any };

      if (error) throw error;
      if (!data) throw new Error('No data returned from track_guest_usage');

      return {
        success: Boolean(data.success),
        usage: {
          usage_count: Number(data.usage_count) || 0,
          daily_limit: Number(data.daily_limit) || APP_CONFIG.RATE_LIMITS.GUEST_DAILY_LIMIT,
          remaining: Number(data.remaining) || 0,
          last_used_at: null,
          session_id: this.guestSessionId
        },
        error: data.success ? undefined : 'Daily usage limit reached'
      };
    } catch (error) {
      console.error('Error incrementing guest usage:', error);
      // Fallback ke localStorage jika server tidak tersedia
      return this.incrementGuestUsageFallback();
    }
  }

  /**
   * Fallback: increment penggunaan guest dari localStorage
   * Digunakan ketika server-side validation tidak tersedia
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

      // Reset jika sudah hari baru untuk memastikan batas harian dihitung ulang
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
        error: 'Daily usage limit reached'
      };
    }

    // Menambah counter penggunaan
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
   * Mendapatkan IP address client (disederhanakan untuk environment browser)
   * Di browser, kita tidak bisa langsung mendapatkan IP asli
   * Di production, bisa menggunakan service seperti ipify.org atau mengambil dari server headers
   */
  private async getClientIP(): Promise<string | null> {
    try {
      // Di browser, kita tidak bisa langsung mendapatkan IP asli
      // Pendekatan ini disederhanakan - di production bisa menggunakan service eksternal
      return 'browser-client';
    } catch (error) {
      console.error('Error getting client IP:', error);
      return null;
    }
  }

  /**
   * Mendapatkan info penggunaan default berdasarkan tipe user
   * Digunakan sebagai fallback ketika terjadi error
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
   * Reset penggunaan (untuk keperluan testing)
   * @param user - User yang terautentikasi atau null untuk guest
   * 
   * Note: Direct access to ai_usage table is safe here because:
   * - RLS policy "Authenticated users can manage own usage" only allows
   *   authenticated users to access their own records (auth.uid() = user_id)
   * - This operation only affects the authenticated user's own records
   * - Guest users use localStorage fallback, not direct table access
   */
  public async resetUsage(user: User | null): Promise<void> {
    if (user) {
      // Untuk user terautentikasi: hapus record penggunaan hari ini
      // Safe: RLS policy ensures only own records can be deleted
      const today = new Date().toISOString().split('T')[0];
      await (supabase as any)
        .from('ai_usage')
        .delete()
        .eq('user_id', user.id)
        .eq('usage_date', today);
    } else {
      // Untuk guest user: reset localStorage
      // Guest usage is tracked via SECURITY DEFINER functions, not direct table access
      this.resetGuestUsage();
    }
  }
}

// Export singleton instance untuk digunakan di seluruh aplikasi
export const rateLimitingService = RateLimitingService.getInstance();
