import { MeLiked, TotalCounter } from '../property/property';
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
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	meLiked?: MeLiked[];
	meFollowed?: MeFollowed[];
	followerData?: Member;
}

export interface Followers {
	list: Follower[];
	metaCounter: TotalCounter[];
}

export interface Following {
	_id: string;
	followingId: string;
	followerId: string;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	meLiked?: MeLiked[];
	meFollowed?: MeFollowed[];
	followingData?: Member;
}

export interface Followings {
	list: Following[];
	metaCounter: TotalCounter[];
}
