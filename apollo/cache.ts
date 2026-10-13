import { InMemoryCache } from '@apollo/client';

export function createApolloCache() {
	return new InMemoryCache({
		typePolicies: {
			// These arrays describe the current viewer. Each response replaces the
			// previous viewer's result, including an empty array after signup/login.
			Member: { fields: { meLiked: { merge: false }, meFollowed: { merge: false } } },
			Car: { fields: { meLiked: { merge: false } } },
			BoardArticle: { fields: { meLiked: { merge: false } } },
		},
	});
}
