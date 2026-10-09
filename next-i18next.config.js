module.exports = {
	// Refresh edited locale files while developing; production resources stay cached.
	reloadOnPrerender: process.env.NODE_ENV === 'development',
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'kr', 'ru'],
		localeDetection: false,
	},
	trailingSlash: true,
};
