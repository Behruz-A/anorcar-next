interface FollowSearch {
	followingId?: string;
	followerId?: string;
}

export interface FollowInquiry {
	page: number;
	limit: number;
	search: FollowSearch;
}
