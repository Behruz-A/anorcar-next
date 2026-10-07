import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { MeLiked, TotalCounter } from '../car/car';
import { MeFollowed } from '../follow/follow';

export interface Member {
	_id: string;
	memberType: MemberType;
	memberStatus: MemberStatus;
	memberAuthType: MemberAuthType;
	memberPhone: string;
	memberNick: string;

	memberFullName?: string | null;
	memberImage: string;
	memberAddress?: string | null;
	memberDesc?: string | null;
	memberCars: number;
	memberRank: number;
	memberArticles: number;
	memberPoints: number;
	memberLikes: number;
	memberFollowers: number;
	memberFollowings: number;
	memberViews: number;
	memberComments: number;
	memberWarnings: number;
	memberBlocks: number;
	deletedAt?: string | null;
	createdAt: string;
	updatedAt: string;
	// Enable for authentications
	meLiked?: MeLiked[] | null;
	meFollowed?: MeFollowed[] | null;
	accessToken?: string | null;
}

export interface Members {
	list: Member[];
	metaCounter?: TotalCounter[] | null;
}
