import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayNotEmpty, IsEnum, IsIn, IsInt, IsMongoId, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { Types } from 'mongoose';
import type { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { CarCondition, CarFuelType, CarLocation, CarStatus, CarTransmission } from '../../enums/car.enum';
import { availableCarOptions, availableCarSorts } from '../../config';

const MAX_CAR_YEAR = new Date().getFullYear() + 1;

@InputType()
export class CarInput {
	@IsEnum(CarFuelType) @Field(() => CarFuelType) carFuelType!: CarFuelType;
	@IsEnum(CarCondition) @Field(() => CarCondition) carCondition!: CarCondition;
	@IsNotEmpty() @Length(1, 80) @Field(() => String) carModel!: string;
	@IsInt() @Min(1886) @Max(MAX_CAR_YEAR) @Field(() => Int) carYear!: number;
	@IsOptional() @IsInt() @Min(0) @Max(2147483647) @Field(() => Int, { nullable: true }) carMileage?: number | null;
	@IsEnum(CarLocation) @Field(() => CarLocation) carLocation!: CarLocation;
	@IsNotEmpty() @Length(3, 100) @Field(() => String) carAddress!: string;
	@IsEnum(CarTransmission) @Field(() => CarTransmission) carTransmission!: CarTransmission;
	@IsNotEmpty() @Length(3, 100) @Field(() => String) carTitle!: string;
	@Min(1) @Field(() => Number) carPrice!: number;
	@IsNotEmpty() @Length(1, 40) @Field(() => String) carColor!: string;
	@ArrayNotEmpty() @Field(() => [String]) carImages!: string[];
	@IsMongoId() @Field(() => String) brandId!: ObjectId;
	@IsOptional() @Length(5, 500) @Field(() => String, { nullable: true }) carDesc?: string;
	@IsOptional() @Field(() => Boolean, { nullable: true }) carBarter?: boolean;
	@IsOptional() @Field(() => Boolean, { nullable: true }) carRent?: boolean;
	memberId?: ObjectId;
}

@InputType()
export class NumberRange {
	@Field(() => Int) start!: number;
	@Field(() => Int) end!: number;
}

@InputType()
class CarSearch {
	@IsOptional() @Field(() => String, { nullable: true }) memberId?: Types.ObjectId;
	@IsOptional() @Field(() => [String], { nullable: true }) brandIds?: Types.ObjectId[];
	@IsOptional() @Field(() => [CarLocation], { nullable: true }) locations?: CarLocation[];
	@IsOptional() @Field(() => [CarFuelType], { nullable: true }) fuelTypes?: CarFuelType[];
	@IsOptional() @Field(() => [CarCondition], { nullable: true }) conditions?: CarCondition[];
	@IsOptional() @Field(() => [CarTransmission], { nullable: true }) transmissions?: CarTransmission[];
	@IsOptional() @IsIn(availableCarOptions, { each: true }) @Field(() => [String], { nullable: true }) options?: string[];
	@IsOptional() @Field(() => NumberRange, { nullable: true }) yearsRange?: NumberRange;
	@IsOptional() @Field(() => NumberRange, { nullable: true }) pricesRange?: NumberRange;
	@IsOptional() @Field(() => String, { nullable: true }) text?: string;
}

@InputType()
export class CarsInquiry {
	@Min(1) @Field(() => Int) page!: number;
	@Min(1) @Field(() => Int) limit!: number;
	@IsOptional() @IsIn(availableCarSorts) @Field(() => String, { nullable: true }) sort?: string;
	@IsOptional() @Field(() => Direction, { nullable: true }) direction?: Direction;
	@Field(() => CarSearch) search!: CarSearch;
}

@InputType()
class AgentCarSearch {
	@IsOptional() @Field(() => CarStatus, { nullable: true }) carStatus?: CarStatus;
}

@InputType()
export class AgentCarsInquiry {
	@Min(1) @Field(() => Int) page!: number;
	@Min(1) @Field(() => Int) limit!: number;
	@IsOptional() @IsIn(availableCarSorts) @Field(() => String, { nullable: true }) sort?: string;
	@IsOptional() @Field(() => Direction, { nullable: true }) direction?: Direction;
	@Field(() => AgentCarSearch) search!: AgentCarSearch;
}

@InputType()
class AdminCarSearch {
	@IsOptional() @Field(() => CarStatus, { nullable: true }) carStatus?: CarStatus;
	@IsOptional() @Field(() => [CarLocation], { nullable: true }) carLocations?: CarLocation[];
	@IsOptional() @Field(() => [String], { nullable: true }) brandIds?: Types.ObjectId[];
}

@InputType()
export class AllCarsInquiry {
	@Min(1) @Field(() => Int) page!: number;
	@Min(1) @Field(() => Int) limit!: number;
	@IsOptional() @IsIn(availableCarSorts) @Field(() => String, { nullable: true }) sort?: string;
	@IsOptional() @Field(() => Direction, { nullable: true }) direction?: Direction;
	@Field(() => AdminCarSearch) search!: AdminCarSearch;
}

@InputType()
export class OrdinaryInquiry {
	@Min(1) @Field(() => Int) page!: number;
	@Min(1) @Field(() => Int) limit!: number;
}
