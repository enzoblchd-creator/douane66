/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",      // <--- C'était ça qui manquait !
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#03040D", // Ton fond noir
        primary: "#6B86FF",    // Bleu clair
        secondary: "#8B57EA",  // Violet bouton
        accent: "#CCD6FF",     // Texte gris
        success: "#57EA92",    // Vert validation
        danger: "#EA575A",     // Rouge refus
        card: "#0E1224",       // Fond des cartes
      },
      fontFamily: {
        sans: ['var(--font-roboto)'],
        serif: ['var(--font-roboto-slab)'],
      },
    },
  },
  plugins: [],
}