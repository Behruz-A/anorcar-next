import { CarCondition, CarFuelType, CarLocation, CarTransmission } from './enums/car.enum';
import { Direction } from './enums/common.enum';
import { CarsInquiry, CarSort, CarInput, CarSearch } from './types/car/car.input';
import { maxCarYear } from './config';

export const carSorts: CarSort[] = ['createdAt', 'carLikes', 'carViews', 'carRank', 'carPrice', 'carYear'];
export const defaultCarsInquiry: CarsInquiry = { page: 1, limit: 9, sort: 'createdAt', direction: Direction.DESC, search: {} };
export const carLabel = (value: string) => value === CarTransmission.AVTOMATIC ? 'Automatic' :
 value.charAt(0) + value.slice(1).toLowerCase();
const record = (value: unknown): Record<string, unknown> =>
 value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

// Whitelist route input so old bookmarks and malformed URLs cannot send invalid GraphQL fields.
export function parseCarsInquiry(value: unknown): CarsInquiry {
 try {
  const input = record(typeof value === 'string' ? JSON.parse(value) : value);
  const raw = record(input.search);
  const search: CarSearch = {};
  const enums = { locations: Object.values(CarLocation), fuelTypes: Object.values(CarFuelType),
   conditions: Object.values(CarCondition), transmissions: Object.values(CarTransmission),
   options: ['carBarter', 'carRent'] };
  for (const [key, allowed] of Object.entries(enums)) {
   const list = raw[key];
   if (Array.isArray(list)) {
    const valid = list.filter(item => typeof item === 'string' && (allowed as string[]).includes(item));
    if (valid.length) Object.assign(search, { [key]: Array.from(new Set(valid)) });
   }
  }
  if (Array.isArray(raw.brandIds)) {
   const ids = raw.brandIds.filter(id => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id));
   if (ids.length) search.brandIds = ids;
  }
  if (typeof raw.memberId === 'string' && /^[a-f\d]{24}$/i.test(raw.memberId)) search.memberId = raw.memberId;
  if (typeof raw.text === 'string' && raw.text.trim()) search.text = raw.text.trim();
  for (const key of ['yearsRange', 'pricesRange'] as const) {
   const range = record(raw[key]);
   if (Number.isSafeInteger(range.start) && Number.isSafeInteger(range.end) &&
    Number(range.start) >= (key === 'yearsRange' ? 1886 : 0) && Number(range.start) <= Number(range.end) &&
    Number(range.end) <= (key === 'yearsRange' ? maxCarYear : 2147483647)) {
    search[key] = { start: Number(range.start), end: Number(range.end) };
   }
  }
  return {
   page: Number.isSafeInteger(input.page) && Number(input.page) > 0 ? Number(input.page) : 1,
   limit: Number.isSafeInteger(input.limit) && Number(input.limit) > 0 && Number(input.limit) <= 100 ? Number(input.limit) : 9,
   sort: carSorts.includes(input.sort as CarSort) ? input.sort as CarSort : 'createdAt',
   direction: input.direction === Direction.ASC ? Direction.ASC : Direction.DESC, search,
  };
 } catch { return { ...defaultCarsInquiry, search: {} }; }
}

export function validateCarInput(input: CarInput): string | undefined {
 if (!Object.values(CarFuelType).includes(input.carFuelType) || !Object.values(CarCondition).includes(input.carCondition) ||
  !Object.values(CarTransmission).includes(input.carTransmission) || !Object.values(CarLocation).includes(input.carLocation))
  return 'Select fuel, condition, transmission, and location.';
 if (!/^[a-f\d]{24}$/i.test(input.brandId)) return 'Select a brand.';
 if (!Number.isInteger(input.carYear) || input.carYear < 1886 || input.carYear > maxCarYear) return 'Enter a valid model year.';
 if (!Number.isFinite(input.carPrice) || input.carPrice < 1) return 'Price must be greater than zero.';
 if (input.carMileage != null && (!Number.isInteger(input.carMileage) || input.carMileage < 0 || input.carMileage > 2147483647))
  return 'Mileage must be a whole number between 0 and 2147483647.';
 for (const [value, minimum, maximum, name] of [
  [input.carTitle, 3, 100, 'Title'], [input.carAddress, 3, 100, 'Address'],
  [input.carModel, 1, 80, 'Model'], [input.carColor, 1, 40, 'Color'],
 ] as [string, number, number, string][]) {
  if (value.trim().length < minimum || value.trim().length > maximum) return `${name} must contain ${minimum}–${maximum} characters.`;
 }
 if (input.carDesc && (input.carDesc.length < 5 || input.carDesc.length > 500)) return 'Description must contain 5–500 characters, or be left empty.';
 if (!input.carImages.length) return 'Upload at least one car photo.';
 return undefined;
}
