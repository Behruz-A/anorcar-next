export const PRICE_CURRENCY = 'KRW';

export function formatPrice(value: number | null | undefined, locale = 'en-US'): string {
	if (value == null || !Number.isFinite(value)) return '—';
	return new Intl.NumberFormat(locale === 'kr' ? 'ko-KR' : locale, {
		style: 'currency',
		currency: PRICE_CURRENCY,
		currencyDisplay: 'narrowSymbol',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}
