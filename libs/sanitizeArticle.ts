import DOMPurify from 'dompurify';

export const sanitizeArticleHtml = (html: string): string =>
	DOMPurify.sanitize(html, {
		USE_PROFILES: { html: true },
		ADD_ATTR: ['rel', 'target', 'hreflang'],
		FORBID_TAGS: ['input', 'textarea', 'form', 'button', 'select', 'meta', 'style', 'link', 'title', 'object', 'base'],
	});
