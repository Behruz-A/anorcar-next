import { ApolloCache, FetchResult, InMemoryCache } from '@apollo/client';

// Like responses contain unpopulated joins. Update engagement only, preserving card content and order.
export function updateLikeCache(cache: ApolloCache<unknown>, result: FetchResult, viewerId: string) {
	if (!viewerId || result.errors?.length) return;
	const targets = [
		['likeTargetCar', 'Car', 'carLikes'],
		['likeTargetMember', 'Member', 'memberLikes'],
		['likeTargetBoardArticle', 'BoardArticle', 'articleLikes'],
	] as const;
	for (const [operation, type, countField] of targets) {
		const record = result.data?.[operation];
		if (!record?._id || typeof record[countField] !== 'number') continue;
		cache.modify({
			id: cache.identify({ __typename: type, _id: record._id }),
			fields: {
				[countField]: () => record[countField],
				meLiked: (previous = [], { readField }) => [{
					__typename: 'MeLiked', memberId: viewerId, likeRefId: record._id,
					myFavorite: !(Array.isArray(previous) && previous.some((like) => readField('myFavorite', like))),
				}],
			},
		});
	}
}

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
