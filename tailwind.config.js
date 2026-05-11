/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── shadcn semantic tokens (preserved) ──────────────────────
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        'xxl-blue': '#0027b8', // preserved — legacy code

        // ── Design System palette ────────────────────────────────────
        sand: {
          50:  '#FBF9F6',
          100: '#F5F2EC',
          200: '#ECE7DD',
          300: '#DCD4C4',
          400: '#B8AC95',
          500: '#8B7E66',
          600: '#5C5240',
          700: '#3D362A',
          800: '#26221B',
          900: '#16140F',
        },
        // Deep Blue — accent primaire (#023047)
        indigo: {
          50:  '#EAF2F7',
          100: '#CCDFEA',
          300: '#6FA5BD',
          500: '#1F6E8C',
          600: '#023047',
          700: '#01233A',
          900: '#01182A',
        },
        sky: {
          50:  '#F0F8FC',
          100: '#DDEEF6',
          300: '#8ECAE6',
          500: '#5BB4D8',
          700: '#2E8AB0',
        },
        // Tiger Orange — accent chaleureux (#FB8500)
        terra: {
          50:  '#FFEFDC',
          100: '#FFDBB0',
          300: '#FFB770',
          500: '#FB8500',
          600: '#D86F00',
          700: '#A35200',
        },
        // Amber chaud — highlights / attention
        flame: {
          50:  '#FFF6DC',
          100: '#FFE7A6',
          300: '#FFCB58',
          500: '#FFB703',
          600: '#D89900',
          700: '#A37200',
        },
        // Sémantiques
        emerald: {
          50:  '#ECF8F1',
          100: '#D2EFDD',
          500: '#2F9E63',
          700: '#1F6E45',
        },
        amber: {
          50:  '#FDF5E6',
          100: '#FAE8C2',
          500: '#D89030',
          700: '#8C5A18',
        },
        rose: {
          50:  '#FCEEEE',
          100: '#F8D6D6',
          500: '#D04848',
          700: '#8E2A2A',
        },
      },

      borderRadius: {
        // shadcn (preserved)
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Design System radii
        'ds-sm':   '6px',
        'ds-md':   '10px',
        'ds-lg':   '14px',
        'ds-xl':   '20px',
        'ds-full': '9999px',
      },

      boxShadow: {
        'ds-sm': '0 1px 2px rgba(38, 34, 27, 0.04)',
        'ds-md': '0 2px 8px rgba(38, 34, 27, 0.06), 0 1px 2px rgba(38, 34, 27, 0.04)',
        'ds-lg': '0 8px 24px rgba(38, 34, 27, 0.08), 0 2px 6px rgba(38, 34, 27, 0.04)',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
