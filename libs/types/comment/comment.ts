import { CommentGroup, CommentStatus } from '../../enums/comment.enum';
import { TotalCounter } from '../car/car';
import { Member } from '../member/member';

export interface Comment {
	_id: string;
	commentStatus: CommentStatus;
	commentGroup: CommentGroup;
	commentContent: string;
	commentRefId: string;
	memberId: string;
	createdAt: string;
	updatedAt: string;
	/** from aggregation **/
	memberData?: Member | null;
}

export interface Comments {
	list: Comment[];
	metaCounter?: TotalCounter[] | null;
}
