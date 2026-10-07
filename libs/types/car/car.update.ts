import { CarInput } from './car.input';
import { CarStatus } from '../../enums/car.enum';
export interface CarUpdate extends Partial<{ [Field in keyof CarInput]: CarInput[Field] | null }> { _id: string; carStatus?: CarStatus | null; }
