import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayNotEmpty, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { CarCondition, CarFuelType, CarLocation, CarStatus, CarTransmission } from '../../enums/car.enum';

const MAX_CAR_YEAR = new Date().getFullYear() + 1;

@InputType()
export class CarUpdate {
	@IsNotEmpty() @Field(() => String) _id!: mongoose.ObjectId;
	@IsOptional() @IsEnum(CarFuelType) @Field(() => CarFuelType, { nullable: true }) carFuelType?: CarFuelType;
	@IsOptional() @IsEnum(CarCondition) @Field(() => CarCondition, { nullable: true }) carCondition?: CarCondition;
	@IsOptional() @Length(1, 80) @Field(() => String, { nullable: true }) carModel?: string;
	@IsOptional() @IsInt() @Min(1886) @Max(MAX_CAR_YEAR) @Field(() => Int, { nullable: true }) carYear?: number;
	@IsOptional() @IsInt() @Min(0) @Max(2147483647) @Field(() => Int, { nullable: true }) carMileage?: number | null;
	@IsOptional() @IsEnum(CarLocation) @Field(() => CarLocation, { nullable: true }) carLocation?: CarLocation;
	@IsOptional() @Length(3, 100) @Field(() => String, { nullable: true }) carAddress?: string;
	@IsOptional() @IsEnum(CarTransmission) @Field(() => CarTransmission, { nullable: true }) carTransmission?: CarTransmission;
	@IsOptional() @Length(3, 100) @Field(() => String, { nullable: true }) carTitle?: string;
	@IsOptional() @Min(1) @Field(() => Number, { nullable: true }) carPrice?: number;
	@IsOptional() @Length(1, 40) @Field(() => String, { nullable: true }) carColor?: string;
	@IsOptional() @ArrayNotEmpty() @Field(() => [String], { nullable: true }) carImages?: string[];
	@IsOptional() @IsMongoId() @Field(() => String, { nullable: true }) brandId?: mongoose.ObjectId;
	@IsOptional() @Length(5, 500) @Field(() => String, { nullable: true }) carDesc?: string;
	@IsOptional() @Field(() => Boolean, { nullable: true }) carBarter?: boolean;
	@IsOptional() @Field(() => Boolean, { nullable: true }) carRent?: boolean;
	@IsOptional() @IsEnum(CarStatus) @Field(() => CarStatus, { nullable: true }) carStatus?: CarStatus;
	soldAt?: Date;
	deletedAt?: Date;
}
