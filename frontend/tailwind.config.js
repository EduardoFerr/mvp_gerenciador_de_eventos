// frontend/tailwind.config.js
const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(210 20% 90%)",          
        input: "hsl(210 20% 95%)",           
        ring: "hsl(215 20% 50%)",            
        background: "hsl(0 0% 100%)",        
        foreground: "hsl(222.2 47.4% 11.2%)", // Texto principal quase preto

        primary: {
          DEFAULT: "hsl(220 70% 30%)",       // Azul escuro/médio
          foreground: "hsl(0 0% 100%)",      // <--- CORREÇÃO: Texto BRANCO para contraste com primary escuro
        },
        secondary: {
          DEFAULT: "hsl(210 40% 90%)",       // Cinza claro
          foreground: "hsl(222.2 47.4% 11.2%)", // <--- CORREÇÃO: Texto ESCURO para contraste com secondary claro
        },
        destructive: {
          DEFAULT: "hsl(0 80% 50%)",         
          foreground: "hsl(0 0% 100%)",      
        },
        muted: {
          DEFAULT: "hsl(210 40% 96.1%)",
          foreground: "hsl(215.4 16.3% 46.9%)", // Cor de texto para elementos secundários (cinza médio)
        },
        accent: {
          DEFAULT: "hsl(210 40% 90%)",       // Destaque (cinza claro)
          foreground: "hsl(222.2 47.4% 11.2%)", // <--- CORREÇÃO: Texto ESCURO para contraste com accent claro
        },
        popover: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222.2 47.4% 11.2%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222.2 47.4% 11.2%)",
        },
      },
      borderRadius: {
        lg: `0.25rem`,
        md: `0.125rem`,
        sm: `0.0625rem`,
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

