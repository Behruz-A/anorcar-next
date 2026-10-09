import { Car } from '../../types/car/car';

const HISTORY_KEY = 'anorcar.compare.recent-searches';
const HISTORY_LIMIT = 20;

export function readCompareHistory(): Car[] {
	try {
		const value: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
		return Array.isArray(value)
			? value
					.filter((car): car is Car => car && typeof car._id === 'string' && typeof car.carModel === 'string')
					.slice(0, HISTORY_LIMIT)
			: [];
	} catch {
		return [];
	}
}

export function rememberCompareSearch(cars: Car[]): Car[] {
	const history = [...cars, ...readCompareHistory()]
		.filter((car, index, all) => all.findIndex((item) => item._id === car._id) === index)
		.slice(0, HISTORY_LIMIT);
	try {
		localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
	} catch {
		/* Searching works even when browser storage is unavailable. */
	}
	return history;
}
