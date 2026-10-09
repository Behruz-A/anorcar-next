import { Car } from './types/car/car';

export const MAX_COMPARE_CARS = 3;

export function parseCompareIds(value: string | string[] | undefined): string[] {
	const ids = (Array.isArray(value) ? value.join(',') : value ?? '')
		.split(',')
		.filter((id) => /^[a-f\d]{24}$/i.test(id))
		.map((id) => id.toLowerCase());
	return Array.from(new Set(ids)).slice(0, MAX_COMPARE_CARS);
}

export function selectCompareCar(slots: (Car | null)[], car: Car, index: number): (Car | null)[] {
	if (
		!Number.isInteger(index) ||
		index < 0 ||
		index >= MAX_COMPARE_CARS ||
		index >= slots.length ||
		slots[index] ||
		slots.some((item) => item?._id === car._id)
	)
		return slots;
	return slots.map((item, slotIndex) => (slotIndex === index ? car : item));
}

export const formatCarPrice = (price: number, locale: string) =>
	new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);

export const formatCarMileage = (car: Car, locale: string): string | undefined =>
	car.carMileage != null && Number.isInteger(car.carMileage) && car.carMileage >= 0
		? `${new Intl.NumberFormat(locale).format(car.carMileage)} km`
		: undefined;
