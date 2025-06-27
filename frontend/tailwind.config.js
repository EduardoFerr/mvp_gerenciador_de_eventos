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
        border: "hsl(210 20% 90%)",          // Borda mais suave e flat
        input: "hsl(210 20% 95%)",           // Fundo de input mais claro e flat
        ring: "hsl(215 20% 50%)",            // Cor para anéis de foco, neutra e sólida
        background: "hsl(0 0% 100%)",        // Fundo principal branco sólido
        foreground: "hsl(222.2 47.4% 11.2%)", // Texto principal quase preto

        primary: {
          DEFAULT: "hsl(220 70% 30%)",       // Um azul escuro/médio, sólido e flat
          foreground: "hsl(0 0% 100%)",      // Texto branco para primário
        },
        secondary: {
          DEFAULT: "hsl(210 40% 90%)",       // Cinza claro, sólido e flat
          foreground: "hsl(222.2 47.4% 11.2%)", // Texto escuro para secundário
        },
        destructive: {
          DEFAULT: "hsl(0 80% 50%)",         // Vermelho sólido e flat
          foreground: "hsl(0 0% 100%)",      // Texto branco para destrutivo
        },
        muted: {
          DEFAULT: "hsl(210 40% 96.1%)",
          foreground: "hsl(215.4 16.3% 46.9%)",
        },
        accent: {
          DEFAULT: "hsl(210 40% 90%)",
          foreground: "hsl(222.2 47.4% 11.2%)",
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
        lg: `0.25rem`, // 4px (padrão 0.5rem ou 8px)
        md: `0.125rem`, // 2px
        sm: `0.0625rem`, // 1px (quase sem arredondamento)
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

