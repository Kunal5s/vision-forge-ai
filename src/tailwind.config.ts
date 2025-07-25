
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
      textShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
        md: '0 2px 4px rgba(0, 0, 0, 0.5)',
        lg: '0 4px 8px rgba(0, 0, 0, 0.5)',
        'glow-cyan': '0 0 8px rgba(0, 255, 255, 0.7)',
        'outline-red': '1px 1px 0 #D90429, -1px -1px 0 #D90429, 1px -1px 0 #D90429, -1px 1px 0 #D90429',
        'light': '0 1px 1px rgba(255, 255, 255, 0.7)',
      },
      fontFamily: {
        'roboto': ['Roboto', 'sans-serif'],
        'open-sans': ['"Open Sans"', 'sans-serif'],
        'lato': ['Lato', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'oswald': ['Oswald', 'sans-serif'],
        'slabo': ['"Slabo 27px"', 'serif'],
        'roboto-condensed': ['"Roboto Condensed"', 'sans-serif'],
        'source-sans': ['"Source Sans Pro"', 'sans-serif'],
        'raleway': ['Raleway', 'sans-serif'],
        'pt-sans': ['"PT Sans"', 'sans-serif'],
        'lobster': ['Lobster', 'cursive'],
        'pacifico': ['Pacifico', 'cursive'],
        'bebas-neue': ['"Bebas Neue"', 'cursive'],
        'anton': ['Anton', 'sans-serif'],
        'dancing-script': ['"Dancing Script"', 'cursive'],
        'indie-flower': ['"Indie Flower"', 'cursive'],
        'caveat': ['Caveat', 'cursive'],
        'shadows-into-light': ['"Shadows Into Light"', 'cursive'],
        'amatic-sc': ['"Amatic SC"', 'cursive'],
        'playfair-display': ['"Playfair Display"', 'serif'],
      },
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
  plugins: [
      require("tailwindcss-animate"), 
      require("@tailwindcss/typography"),
      function({ addUtilities, theme }: { addUtilities: any, theme: any }) {
        const newUtilities = {
          '.text-shadow-sm': {
            textShadow: theme('textShadow.sm'),
          },
          '.text-shadow-md': {
            textShadow: theme('textShadow.md'),
          },
          '.text-shadow-lg': {
            textShadow: theme('textShadow.lg'),
          },
          '.text-shadow-glow-cyan': {
            textShadow: theme('textShadow.glow-cyan'),
          },
          '.text-shadow-outline-red': {
            textShadow: theme('textShadow.outline-red'),
          },
          '.text-shadow-light': {
            textShadow: theme('textShadow.light'),
          },
        }
        addUtilities(newUtilities, ['responsive', 'hover'])
      }
  ],
} satisfies Config;
