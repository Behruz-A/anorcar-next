import { BoardArticleCategory } from './enums/board-article.enum';

export const communityCategories = [
	{ value: BoardArticleCategory.FREE, label: 'Free Board' },
	{ value: BoardArticleCategory.RECOMMEND, label: 'Recommendations' },
	{ value: BoardArticleCategory.NEWS, label: 'News' },
	{ value: BoardArticleCategory.HUMOR, label: 'Humor' },
];

// Excerpts are text only: never render stored editor HTML in browse cards.
export function articleExcerpt(content: string, maxLength?: number): string {
	const text = content
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
	if (maxLength === undefined) return text;
	// Compact card previews retain the source domain instead of long URL paths/query strings.
	const preview = text.replace(/(?:https?:\/\/|www\.)[^\s<>]+/gi, (url) => {
		const punctuation = url.match(/[.,!?;:)\]}]+$/)?.[0] ?? '';
		const address = punctuation ? url.slice(0, -punctuation.length) : url;
		try {
			return new URL(address.startsWith('www.') ? `https://${address}` : address).hostname.replace(/^www\./, '') + punctuation;
		} catch {
			return url;
		}
	});
	const characters = Array.from(preview);
	if (characters.length <= maxLength) return preview;
	const shortened = characters.slice(0, maxLength - 1).join('');
	const wordEnd = shortened.lastIndexOf(' ');
	return `${(wordEnd > shortened.length * .6 ? shortened.slice(0, wordEnd) : shortened).trimEnd()}…`;
}
