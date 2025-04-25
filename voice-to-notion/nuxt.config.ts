// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxtjs/google-fonts", "nuxt-toastify"],
  runtimeConfig: {
    GEMINI_KEY: "",
  },
  googleFonts: {
    families: {
      "Gowun Batang": true,
    },
  },
  toastify: {
    position: "top-right",
    theme: "dark",
    autoClose: 3000,
    closeOnClick: true,
    pauseOnHover: true,
  },
  devServer: {
    host: "0.0.0.0",
  },
});
