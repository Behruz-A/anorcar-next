/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	eslint: { dirs: ['pages', 'libs', 'apollo'] },
 async redirects() {
  return [
   { source: '/property/detail', destination: '/car/detail', permanent: true },
   { source: '/property', destination: '/car', permanent: true },
   { source: '/_admin/properties', destination: '/_admin/cars', permanent: true },
  ];
 },
	env: {
		REACT_APP_API_URL: process.env.REACT_APP_API_URL,
		REACT_APP_API_GRAPHQL_URL: process.env.REACT_APP_API_GRAPHQL_URL,
		REACT_APP_API_WS: process.env.REACT_APP_API_WS,
	},
};

const { i18n } = require('./next-i18next.config');
nextConfig.i18n = i18n;

module.exports = nextConfig;
