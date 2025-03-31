export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@prisma/nuxt"],
  css: ["~/app.css"],
  runtimeConfig: {
    API_KEY: "",
    AUTH0_DOMAIN: "",
    AUTH0_CLIENT_ID: "",
    AUTH0_SECRET: "",
    SERVER_BASE_URL: "",
    public: {
      SERVER_BASE_URL: "",
    },
  },
});
