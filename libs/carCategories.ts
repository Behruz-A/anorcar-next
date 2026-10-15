import { CarBodyType, CarFuelType, CarSegment } from './enums/car.enum';
import { CarSearch } from './types/car/car.input';

export const carCategories = [
 { key: 'all', label: 'All Types' },
 { key: 'sedan', label: 'Sedan', body: CarBodyType.SEDAN },
 { key: 'suv', label: 'SUV', body: CarBodyType.SUV },
 { key: 'hatchback', label: 'Hatchback', body: CarBodyType.HATCHBACK },
 { key: 'truck', label: 'Truck', body: CarBodyType.TRUCK },
 { key: 'electric', label: 'Electric', fuel: CarFuelType.ELECTRIC },
 { key: 'hybrid', label: 'Hybrid', fuel: CarFuelType.HYBRID },
 { key: 'luxury', label: 'Luxury', segment: CarSegment.LUXURY },
 { key: 'van', label: 'Van', body: CarBodyType.VAN },
 { key: 'convertible', label: 'Convertible', body: CarBodyType.CONVERTIBLE },
] as const;
export type CarCategory = typeof carCategories[number];

export function applyCarCategory(search: CarSearch, category: CarCategory): CarSearch {
 const next = { ...search, bodyTypes: undefined, segments: undefined };
 if ('body' in category) return { ...next, bodyTypes: [category.body] };
 if ('segment' in category) return { ...next, segments: [category.segment] };
 return { ...next, fuelTypes: 'fuel' in category ? [category.fuel] : undefined };
}

export function activeCarCategory(search: CarSearch): string {
 return carCategories.find(category => 'body' in category && search.bodyTypes?.includes(category.body))?.key ??
  carCategories.find(category => 'segment' in category && search.segments?.includes(category.segment))?.key ??
  carCategories.find(category => 'fuel' in category && search.fuelTypes?.includes(category.fuel))?.key ?? 'all';
}
