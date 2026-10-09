import { CarLocation, CarStatus, CarFuelType, CarCondition, CarTransmission } from '../../enums/car.enum';
import { Direction } from '../../enums/common.enum';
import { CarMileage } from './car-mileage';
export interface CarInput {
 carFuelType: CarFuelType;
 carCondition: CarCondition;
 carModel: string;
 carYear: number;
 carMileage?: CarMileage | null;
 carLocation: CarLocation;
 carAddress: string;
 carTransmission: CarTransmission;
 carTitle: string;
 carPrice: number;
 carColor: string;
 carImages: string[];
 brandId: string;
 carDesc?: string | null;
 carBarter?: boolean | null;
 carRent?: boolean | null;
}
export interface NumberRange { start: number; end: number; }
export type CarSort = 'createdAt' | 'carLikes' | 'carViews' | 'carRank' | 'carPrice' | 'carYear';
export interface CarSearch {
 memberId?: string;
 brandIds?: string[];
 locations?: CarLocation[];
 fuelTypes?: CarFuelType[];
 conditions?: CarCondition[];
 transmissions?: CarTransmission[];
 options?: ('carBarter' | 'carRent')[];
 pricesRange?: NumberRange;
 yearsRange?: NumberRange;
 text?: string;
}
export interface CarsInquiry { page: number; limit: number; sort?: CarSort; direction?: Direction; search: CarSearch; }
export interface AgentCarsInquiry { page: number; limit: number; sort?: CarSort; direction?: Direction; search: { carStatus?: CarStatus }; }
export interface AllCarsInquiry { page: number; limit: number; sort?: CarSort; direction?: Direction; search: { carStatus?: CarStatus; carLocations?: CarLocation[]; brandIds?: string[] }; }
export interface OrdinaryInquiry { page: number; limit: number; }
