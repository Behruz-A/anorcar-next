import { Direction } from './enums/common.enum';
import { CarsInquiry } from './types/car/car.input';

// Listing prices and search bounds are both in Korean won.
export const carBudgets = [
 { key: 'under10', label: 'Under ₩10M', maxPrice: 10000000, image: 'budget-blue' },
 { key: 'under20', label: 'Under ₩20M', maxPrice: 20000000, image: 'budget-orange' },
 { key: 'under30', label: 'Under ₩30M', maxPrice: 30000000, image: 'budget-red' },
 { key: 'under40', label: 'Under ₩40M', maxPrice: 40000000, image: 'budget-green' },
 { key: 'under50', label: 'Under ₩50M', maxPrice: 50000000, image: 'budget-slate' },
 { key: 'under75', label: 'Under ₩75M', maxPrice: 75000000, image: 'budget-yellow' },
 { key: 'under100', label: 'Under ₩100M', maxPrice: 100000000, image: 'budget-white' },
 { key: 'anyBudget', label: 'Any Budget', maxPrice: undefined, image: 'budget-silver' },
] as const;

export function budgetCarsInquiry(maxPrice?: number): CarsInquiry {
 return { page: 1, limit: 9, sort: 'carPrice', direction: Direction.ASC,
  search: maxPrice === undefined ? {} : { pricesRange: { start: 0, end: maxPrice } } };
}
