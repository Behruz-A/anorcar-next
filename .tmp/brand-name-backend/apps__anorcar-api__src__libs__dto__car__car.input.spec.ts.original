import 'reflect-metadata';
import { validate } from 'class-validator';
import { CarInput } from './car.input';
import { CarCondition, CarFuelType, CarLocation, CarTransmission } from '../../enums/car.enum';

const validInput = (): CarInput => Object.assign(new CarInput(), {
	carFuelType: CarFuelType.GASOLINE,
	carCondition: CarCondition.USED,
	carModel: 'Sonata',
	carYear: 2022,
	carLocation: CarLocation.SEOUL,
	carAddress: 'Gangnam-gu',
	carTransmission: CarTransmission.AUTOMATIC,
	carTitle: 'Clean used Sonata',
	carPrice: 20000,
	carColor: 'Black',
	carImages: ['https://example.com/car.jpg'],
	brandId: '507f1f77bcf86cd799439011',
});

describe('CarInput', () => {
	it.each(Object.values(CarFuelType))('accepts fuel type %s', async (value) => {
		const input = validInput(); input.carFuelType = value;
		expect(await validate(input)).toHaveLength(0);
	});

	it.each(Object.values(CarCondition))('accepts condition %s', async (value) => {
		const input = validInput(); input.carCondition = value;
		expect(await validate(input)).toHaveLength(0);
	});

	it.each(Object.values(CarTransmission))('accepts transmission %s', async (value) => {
		const input = validInput(); input.carTransmission = value;
		expect(await validate(input)).toHaveLength(0);
	});

	it('rejects legacy AVTOMATIC and empty images', async () => {
		const input = validInput();
		input.carTransmission = 'AVTOMATIC' as CarTransmission;
		input.carImages = [];
		const errors = await validate(input);
		expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['carTransmission', 'carImages']));
	});
});

// The corrected location values must be valid; old persisted spellings are migrated separately.
describe('Car enum spelling', () => {
 it.each(Object.values(CarLocation))('accepts location %s', async (location) => {
  const input = validInput(); input.carLocation = location;
  expect(await validate(input)).toHaveLength(0);
 });
 it('rejects legacy DAEJON', async () => {
  const input = validInput(); input.carLocation = 'DAEJON' as CarLocation;
  const errors = await validate(input);
  expect(errors.map(error => error.property)).toContain('carLocation');
 });
});
