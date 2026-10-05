import { BoardArticleStatus } from '../../enums/board-article.enum';

export interface BoardArticleUpdate {
	_id: string;
	articleStatus?: BoardArticleStatus;
	articleTitle?: string;
	articleContent?: string;
	articleImage?: string;
}
