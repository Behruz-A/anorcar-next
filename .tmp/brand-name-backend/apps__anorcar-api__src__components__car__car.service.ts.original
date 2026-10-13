import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Cars, Car } from '../../libs/dto/car/car';
import { Direction, Message } from '../../libs/enums/common.enum';
import {
	AgentCarsInquiry,
	AllCarsInquiry,
	OrdinaryInquiry,
	CarsInquiry,
	CarInput,
} from '../../libs/dto/car/car.input';
import { MemberService } from '../member/member.service';
import { CarStatus } from '../../libs/enums/car.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { CarUpdate } from '../../libs/dto/car/car.update';
import moment from 'moment';
import { lookupAuthMemberLiked, lookupBrand, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { BrandService } from '../brand/brand.service';

@Injectable()
export class CarService {
	constructor(
		@InjectModel('Car') private readonly carModel: Model<Car>,
		private memberService: MemberService,
		private viewService: ViewService,
		private likeService: LikeService,
		private brandService: BrandService,
	) {}

	public async createCar(input: CarInput): Promise<Car> {
		await this.brandService.getBrand(shapeIntoMongoObjectId(input.brandId));
		try {
			const result = await this.carModel.create(input);
			// increase memberCaries
			await this.memberService.memberStatsEditor({ _id: result.memberId, targetKey: 'memberCars', modifier: 1 });

			return result;
		} catch (err: any) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getCar(memberId: ObjectId, carId: ObjectId): Promise<Car> {
		const search: T = {
			_id: carId,
			carStatus: CarStatus.ACTIVE,
		};

		const targetCar: Car = (await this.carModel.findOne(search).lean().exec()) as Car;
		if (!targetCar) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: carId, viewGroup: ViewGroup.CAR };
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.carStatsEditor({ _id: carId, targetKey: 'carViews', modifier: 1 });
				targetCar.carViews++;
			}
			// meLiked

			const likeInput = { memberId: memberId, likeRefId: carId, likeGroup: LikeGroup.CAR };
			targetCar.meLiked = await this.likeService.checkLikeExistence(likeInput);
		}

		targetCar.memberData = await this.memberService.getMember(null, targetCar.memberId);
		targetCar.brandData = await this.brandService.getBrand(targetCar.brandId, true);
		return targetCar;
	}

	public async updateCar(memberId: ObjectId, input: CarUpdate): Promise<Car> {
		if (input.brandId) await this.brandService.getBrand(shapeIntoMongoObjectId(input.brandId));
		const { carStatus } = input;
		const search: T = {
			_id: input._id,
			memberId: memberId,
			carStatus: CarStatus.ACTIVE,
		};

		if (carStatus === CarStatus.SOLD) input.soldAt = moment().toDate();
		else if (carStatus === CarStatus.DELETE) input.deletedAt = moment().toDate();

		const result = await this.carModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (input.soldAt || input.deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: memberId,
				targetKey: 'memberCars',
				modifier: -1,
			});
		}

		return result;
	}

	public async getCars(memberId: ObjectId, input: CarsInquiry): Promise<Cars> {
		const match: T = { carStatus: CarStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);
		console.log('match:', match);

		const result = await this.carModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId),
							// meLiked
							lookupMember,
							{ $unwind: '$memberData' }, // check it
							lookupBrand,
							{ $unwind: '$brandData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	private shapeMatchQuery(match: T, input: CarsInquiry): void {
		const {
			memberId,
			brandIds,
			locations,
			fuelTypes,
			conditions,
			transmissions,
			yearsRange,
			pricesRange,
			options,
			text,
		} = input.search;

		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
		if (brandIds?.length) match.brandId = { $in: brandIds.map(shapeIntoMongoObjectId) };
		if (locations?.length) match.carLocation = { $in: locations };
		if (fuelTypes?.length) match.carFuelType = { $in: fuelTypes };
		if (conditions?.length) match.carCondition = { $in: conditions };
		if (transmissions?.length) match.carTransmission = { $in: transmissions };

		this.assertValidRange(pricesRange);
		this.assertValidRange(yearsRange);
		if (pricesRange) match.carPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
		if (yearsRange) match.carYear = { $gte: yearsRange.start, $lte: yearsRange.end };

		if (text) match['$and'] = [{ $or: [{ carTitle: { $regex: new RegExp(text, 'i') } }, { carModel: { $regex: new RegExp(text, 'i') } }] }];
		if (options) {
			match['$or'] = options.map((ele) => {
				return { [ele]: true };
			});
		}
	}

	private assertValidRange(range?: { start: number; end: number }): void {
		if (range && range.start > range.end) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Cars> {
		return await this.likeService.getFavoriteCars(memberId, input);
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Cars> {
		return await this.viewService.getVisitedCars(memberId, input);
	}

	public async getAgentCars(memberId: ObjectId, input: AgentCarsInquiry): Promise<Cars> {
		const { carStatus } = input.search;
		if (carStatus === CarStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const match: T = {
			memberId: memberId,
			carStatus: carStatus ?? { $ne: CarStatus.DELETE },
		};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.carModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
							lookupBrand,
							{ $unwind: '$brandData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async likeTargetCar(memberId: ObjectId, likeRefId: ObjectId): Promise<Car> {
		const target = await this.carModel.findOne({ _id: likeRefId, carStatus: CarStatus.ACTIVE }).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.CAR,
		};

		const modifier: number = await this.likeService.toggleLike(input);

		const result = await this.carStatsEditor({
			_id: likeRefId,
			targetKey: 'carLikes',
			modifier: modifier,
		});

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async getAllCarsByAdmin(input: AllCarsInquiry): Promise<Cars> {
		const { carStatus, carLocations, brandIds } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (carStatus) match.carStatus = carStatus;
		if (carLocations?.length) match.carLocation = { $in: carLocations };
		if (brandIds?.length) match.brandId = { $in: brandIds.map(shapeIntoMongoObjectId) };

		const result = await this.carModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
							lookupBrand,
							{ $unwind: '$brandData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateCarByAdmin(input: CarUpdate): Promise<Car> {
		if (input.brandId) await this.brandService.getBrand(shapeIntoMongoObjectId(input.brandId));
		const { carStatus } = input;
		const search: T = {
			_id: input._id,
			carStatus: CarStatus.ACTIVE,
		};

		if (carStatus === CarStatus.SOLD) input.soldAt = moment().toDate();
		else if (carStatus === CarStatus.DELETE) input.deletedAt = moment().toDate();

		const result = await this.carModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (input.soldAt || input.deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberCars',
				modifier: -1,
			});
		}

		return result;
	}

	public async removeCarByAdmin(carId: ObjectId): Promise<Car> {
		const search: T = { _id: carId, carStatus: CarStatus.DELETE };
		const result = await this.carModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async carStatsEditor(input: StatisticModifier): Promise<Car> {
		const { _id, targetKey, modifier } = input;
		const statsModifier: T = { [targetKey]: modifier };

		if (targetKey === 'carLikes') statsModifier.carRank = modifier * 2;
		else if (targetKey === 'carViews') statsModifier.carRank = modifier;

		return (await this.carModel
			.findByIdAndUpdate(
				_id,
				{ $inc: statsModifier },
				{
					new: true,
				},
			)
			.exec()) as Car;
	}
}
