/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        "brand-700": "var(--brand-700)",
        soft: "var(--bg-soft)",
        panel: "var(--panel)",
        sidebar: "var(--sidebar)",
        text: "var(--text)",
        subtle: "var(--subtle)",
      },
      boxShadow: {
        header: "0 1px 0 0 var(--subtle)",
      },
    },
  },
};
