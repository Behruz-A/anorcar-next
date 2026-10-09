import { maxCarYear } from '../../config';
import { CarSearch, NumberRange } from '../../types/car/car.input';

export type RangeKey = 'yearsRange' | 'pricesRange';
export interface RangeDraft {
	start: string;
	end: string;
}
export type RangeDrafts = Record<RangeKey, RangeDraft>;
export const rangeBounds = (key: RangeKey): NumberRange =>
	key === 'yearsRange' ? { start: 1886, end: maxCarYear } : { start: 0, end: 2147483647 };

export function rangeDrafts(search: CarSearch): RangeDrafts {
	const draft = (key: RangeKey): RangeDraft => {
		const bounds = rangeBounds(key);
		return {
			start: search[key] && search[key]?.start !== bounds.start ? String(search[key]?.start) : '',
			end: search[key] && search[key]?.end !== bounds.end ? String(search[key]?.end) : '',
		};
	};
	return { yearsRange: draft('yearsRange'), pricesRange: draft('pricesRange') };
}

export function validateRange(key: RangeKey, draft: RangeDraft) {
	const bounds = rangeBounds(key);
	const invalid = (value: string) =>
		value.trim() !== '' &&
		(!/^\d+$/.test(value.trim()) ||
			!Number.isSafeInteger(Number(value)) ||
			Number(value) < bounds.start ||
			Number(value) > bounds.end);
	const startError = invalid(draft.start),
		endError = invalid(draft.end);
	const start = draft.start.trim() === '' ? bounds.start : Number(draft.start);
	const end = draft.end.trim() === '' ? bounds.end : Number(draft.end);
	const reversed = !startError && !endError && start > end;
	return {
		startError: startError || reversed,
		endError: endError || reversed,
		error: startError || endError ? ('bounds' as const) : reversed ? ('order' as const) : undefined,
		range: draft.start.trim() === '' && draft.end.trim() === '' ? undefined : { start, end },
	};
}

// Incoming URL text may already contain regex syntax. Only newly edited text is escaped.
export const escapeSearchText = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const displaySearchText = (value = '') => value.replace(/\\([.*+?^${}()|[\]\\])/g, '$1');

export function applyBrowseDraft(
	search: CarSearch,
	ranges: RangeDrafts,
	text: string,
	textEdited: boolean,
): CarSearch | undefined {
	const years = validateRange('yearsRange', ranges.yearsRange);
	const prices = validateRange('pricesRange', ranges.pricesRange);
	if (years.error || prices.error) return undefined;
	return {
		...search,
		yearsRange: years.range,
		pricesRange: prices.range,
		text: textEdited ? (text.trim() ? escapeSearchText(text.trim()) : undefined) : search.text,
	};
}
