import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Brand } from '../../libs/dto/brand/brand';
import { BrandInput } from '../../libs/dto/brand/brand.input';
import { BrandUpdate } from '../../libs/dto/brand/brand.update';
import { BrandStatus } from '../../libs/enums/brand.enum';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class BrandService {
	constructor(@InjectModel('Brand') private readonly brandModel: Model<Brand>) {}

	public async createBrand(input: BrandInput): Promise<Brand> {
		try {
			return await this.brandModel.create(input);
		} catch (err) {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getBrand(brandId: ObjectId, includeDeleted = false): Promise<Brand> {
		const search = includeDeleted ? { _id: brandId } : { _id: brandId, brandStatus: BrandStatus.ACTIVE };
		const brand = await this.brandModel.findOne(search).exec();
		if (!brand) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return brand;
	}

	public async getBrands(): Promise<Brand[]> {
		return await this.brandModel.find({ brandStatus: BrandStatus.ACTIVE }).sort({ brandName: 1 }).exec();
	}

	public async getAllBrandsByAdmin(): Promise<Brand[]> {
		return await this.brandModel.find().sort({ brandName: 1 }).exec();
	}

	public async updateBrandByAdmin(input: BrandUpdate): Promise<Brand> {
		try {
			const result = await this.brandModel.findByIdAndUpdate(input._id, input, { new: true }).exec();
			if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
			return result;
		} catch (err) {
			if (err instanceof InternalServerErrorException) throw err;
			throw new BadRequestException(Message.UPDATE_FAILED);
		}
	}

	public async removeBrandByAdmin(brandId: ObjectId): Promise<Brand> {
		const result = await this.brandModel
			.findOneAndUpdate({ _id: brandId, brandStatus: BrandStatus.ACTIVE }, { brandStatus: BrandStatus.DELETE }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}
}
