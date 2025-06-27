// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Define o diretório de origem para os arquivos da aplicação.
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;

