import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Legacy tokens
        '2xs': 'var(--text-2xs)',
        'xs-sm': 'var(--text-xs-sm)',
        'sm-md': 'var(--text-sm-md)',
        // Typography Scale - Semantic
        'page-title': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'section-title': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'card-title': ['0.9375rem', { lineHeight: '1.5rem', fontWeight: '500' }],
        'body': ['0.875rem', { lineHeight: '1.625rem' }],
        'body-lg': ['1rem', { lineHeight: '1.75rem' }],
        'meta': ['0.75rem', { lineHeight: '1.25rem' }],
        'caption': ['0.6875rem', { lineHeight: '1rem' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand Colors - Orange Primary
        brand: {
          DEFAULT: "hsl(var(--brand-primary))",
          foreground: "hsl(var(--brand-primary-foreground))",
          secondary: "hsl(var(--brand-secondary))",
        },
        // Action Colors
        action: {
          DEFAULT: "hsl(var(--action-primary))",
          hover: "hsl(var(--action-primary-hover))",
          foreground: "hsl(var(--action-primary-foreground))",
          secondary: "hsl(var(--action-secondary))",
          "secondary-foreground": "hsl(var(--action-secondary-foreground))",
        },
        // Status Colors
        status: {
          public: "hsl(var(--status-public))",
          "public-foreground": "hsl(var(--status-public-foreground))",
          "public-bg": "hsl(var(--status-public-bg))",
          private: "hsl(var(--status-private))",
          "private-foreground": "hsl(var(--status-private-foreground))",
          "private-bg": "hsl(var(--status-private-bg))",
        },
        // Surface Colors
        surface: {
          DEFAULT: "hsl(var(--surface-default))",
          subtle: "hsl(var(--surface-subtle))",
          elevated: "hsl(var(--surface-elevated))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "var(--radius-sm)",
        md: "var(--radius)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-lg)",
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem',
      },
      lineHeight: {
        'tight': '1.25',
        'snug': '1.375',
        'normal': '1.5',
        'relaxed': '1.625',
        'loose': '1.75',
        'prose': '1.8',
      },
    },
  },
  plugins: [],
} satisfies Config;
