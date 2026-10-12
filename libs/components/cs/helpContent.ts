export type HelpCategory = 'all' | 'cars' | 'selling' | 'account' | 'agents' | 'community' | 'technical';
export const helpTopics: { id: Exclude<HelpCategory, 'all'>; title: string; description: string }[] = [
	{
		id: 'cars',
		title: 'Buying a car',
		description: 'Search, compare, and save cars.',
	},
	{ id: 'selling', title: 'Selling a car', description: 'Publish and manage your listings.' },
	{ id: 'account', title: 'My account', description: 'Profile settings and saved cars.' },
	{
		id: 'agents',
		title: 'Agents & dealerships',
		description: 'Find agents and contact details.',
	},
	{
		id: 'community',
		title: 'Community',
		description: 'Posts, discussions, and members.',
	},
	{
		id: 'technical',
		title: 'Technical support',
		description: 'Sign-in, uploads, and loading issues.',
	},
];
export interface HelpQuestion {
	id: string;
	category: HelpCategory;
	question: string;
	answer: string;
	action: string;
	href: string;
}
export const helpQuestions: HelpQuestion[] = [
	{
		id: 'search',
		category: 'cars',
		question: 'How do I search for cars on ANORCAR?',
		answer:
			'Open Cars and filter by brand, year, fuel, transmission, condition, location, or price. Use the search field to look for a model or keyword. Clear filters to see more listings.',
		action: 'Browse cars',
		href: '/car',
	},
	{
		id: 'compare',
		category: 'cars',
		question: 'How can I compare different cars?',
		answer:
			'Use the compare control on a car listing to add it to your comparison. Open Compare to review the selected cars side by side, including their price and specifications.',
		action: 'Compare cars',
		href: '/car/compare',
	},
	{
		id: 'favorites',
		category: 'account',
		question: 'How do I save my favorite cars?',
		answer:
			'Sign in and select the heart on a car listing. Find your saved listings under My Favorites in My Page. Select the heart again to remove a car.',
		action: 'My Favorites',
		href: '/mypage?category=myFavorites',
	},
	{
		id: 'contact',
		category: 'agents',
		question: 'How do I contact a car agent?',
		answer:
			'Open a car listing or visit Agents to find the agent profile. Use the contact details provided on their profile. Confirm availability and arrange viewing directly with the agent.',
		action: 'Explore agents',
		href: '/agent',
	},
	{
		id: 'profile',
		category: 'account',
		question: 'How do I update my profile?',
		answer:
			'Sign in, open My Page, and choose My Profile. Update your username, phone, address, or profile photo, then select Save Changes. Cancel restores your saved details.',
		action: 'My Profile',
		href: '/mypage?category=myProfile',
	},
	{
		id: 'publish',
		category: 'selling',
		question: 'How can an authorized agent publish a car listing?',
		answer:
			'Car publishing is available to accounts with the Agent role. In My Page, choose Add car, select an active brand, enter the car details, upload photos, and submit the listing.',
		action: 'Add car',
		href: '/mypage?category=addCar',
	},
	{
		id: 'inventory',
		category: 'selling',
		question: 'How do I manage my car listings?',
		answer:
			'Open My cars in My Page to edit your listings and update their status. Mark a completed sale as Sold. Review any delete confirmation carefully before removing a listing.',
		action: 'My cars',
		href: '/mypage?category=myCars',
	},
	{
		id: 'payment',
		category: 'cars',
		question: 'Does ANORCAR process vehicle payments?',
		answer:
			'Payment, rental, and exchange terms are arranged directly with the seller. Confirm the vehicle, documents, and agreed terms before making a payment.',
		action: 'Browse cars',
		href: '/car',
	},
	{
		id: 'agent-listings',
		category: 'agents',
		question: 'Where can I see an agent’s available cars?',
		answer:
			'Visit the agent profile and open Listings. Choose View All to browse cars from that agent using the full car search filters.',
		action: 'Explore agents',
		href: '/agent',
	},
	{
		id: 'articles',
		category: 'community',
		question: 'How can I join the community?',
		answer:
			'Browse Community to read posts. Sign in to like posts, leave comments, follow members, or write your own article. Choose a category that matches your topic.',
		action: 'Explore Community',
		href: '/community',
	},
	{
		id: 'signin',
		category: 'technical',
		question: 'What should I do if I cannot sign in?',
		answer:
			'Check your username and password, then try again. If the problem continues, email info@anorcar.com with the error message. Never share your password or sign-in token.',
		action: 'Login / Register',
		href: '/account/join',
	},
	{
		id: 'photo',
		category: 'technical',
		question: 'Why will my profile photo not upload?',
		answer:
			'Choose a supported image file no larger than 5 MB. Wait for the upload to finish before saving. If it fails, check your connection and try another image.',
		action: 'My Profile',
		href: '/mypage?category=myProfile',
	},
	{
		id: 'loading',
		category: 'technical',
		question: 'What if a page or listing does not load?',
		answer:
			'Check your connection and use Retry when it is available. Refresh the page if the issue continues. Email info@anorcar.com with the page address and error message so we can investigate.',
		action: 'Email support',
		href: 'mailto:info@anorcar.com',
	},
];
