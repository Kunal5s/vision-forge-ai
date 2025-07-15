
import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
      typography: ({ theme }: { theme: any }) => ({
        DEFAULT: {
          css: {
            '--prose-links': theme('colors.green[700]'),
            '--prose-invert-links': theme('colors.green[400]'),
            a: {
              textDecoration: 'underline',
              '&:hover': {
                opacity: '0.8',
              },
            },
            p: {
              fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', // ~16px to 18.4px
              lineHeight: '1.7',
            },
            h1: {
              fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', // ~28px to 40px
              fontWeight: '700',
            },
            h2: {
              fontSize: 'clamp(1.5rem, 4vw, 2rem)', // ~24px to 32px
              fontWeight: '600',
            },
            h3: {
              fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', // ~20px to 28px
              fontWeight: '600',
            },
             blockquote: {
              fontStyle: 'italic',
              borderLeftWidth: '4px',
              borderLeftColor: theme('colors.border'),
              paddingLeft: '1rem',
              color: theme('colors.muted.foreground'),
            },
            'img, video': {
              marginLeft: 'auto',
              marginRight: 'auto',
              borderRadius: theme('borderRadius.lg'),
            },
          }
        }
      }),
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
        'breathing-glow': {
          '0%, 100%': { boxShadow: '0 0 5px hsl(var(--foreground) / 0.2), 0 0 10px hsl(var(--foreground) / 0.1)' },
          '50%': { boxShadow: '0 0 15px hsl(var(--foreground) / 0.4), 0 0 25px hsl(var(--foreground) / 0.3)' },
        }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
        'breathing-glow': 'breathing-glow 4s ease-in-out infinite alternate',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
