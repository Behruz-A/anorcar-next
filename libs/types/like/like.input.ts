import { LikeGroup } from '../../enums/like.enum';

export interface LikeInput {
	memberId: string;
	likeRefId: string;
	likeGroup: LikeGroup;
}
