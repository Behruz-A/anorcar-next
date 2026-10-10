import { BoardArticleCategory } from './enums/board-article.enum';

export const communityCategories = [
	{ value: BoardArticleCategory.FREE, label: 'Free Board' },
	{ value: BoardArticleCategory.RECOMMEND, label: 'Recommendations' },
	{ value: BoardArticleCategory.NEWS, label: 'News' },
	{ value: BoardArticleCategory.HUMOR, label: 'Humor' },
];

// Excerpts are text only: never render stored editor HTML in browse cards.
export function articleExcerpt(content: string): string {
	return content
		.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
		.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;|&#160;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;|&apos;/gi, "'")
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/\s+/g, ' ')
		.trim();
}
