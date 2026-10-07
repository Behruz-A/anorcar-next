import { BoardArticleCategory, BoardArticleStatus } from '../../enums/board-article.enum';
import { Member } from '../member/member';
import { MeLiked, TotalCounter } from '../car/car';

export interface BoardArticle {
	_id: string;
	articleCategory: BoardArticleCategory;
	articleStatus: BoardArticleStatus;
	articleTitle: string;
	articleContent: string;
	articleImage?: string | null;
	articleViews: number;
	articleLikes: number;
	articleComments: number;
	memberId: string;
	createdAt: string;
	updatedAt: string;
	/** from aggregation **/
	meLiked?: MeLiked[] | null;
	memberData?: Member | null;
}

export interface BoardArticles {
	list: BoardArticle[];
	metaCounter?: TotalCounter[] | null;
}
