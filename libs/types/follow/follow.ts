import { MeLiked, TotalCounter } from '../car/car';
import { Member } from '../member/member';

export interface MeFollowed {
	followingId: string;
	followerId: string;
	myFollowing: boolean;
}

export interface Follower {
	_id: string;
	followingId: string;
	followerId: string;
	createdAt: string;
	updatedAt: string;
	/** from aggregation **/
	meLiked?: MeLiked[] | null;
	meFollowed?: MeFollowed[] | null;
	followerData?: Member | null;
}

export interface Followers {
	list: Follower[];
	metaCounter?: TotalCounter[] | null;
}

export interface Following {
	_id: string;
	followingId: string;
	followerId: string;
	createdAt: string;
	updatedAt: string;
	/** from aggregation **/
	meLiked?: MeLiked[] | null;
	meFollowed?: MeFollowed[] | null;
	followingData?: Member | null;
}

export interface Followings {
	list: Following[];
	metaCounter?: TotalCounter[] | null;
}
