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

	// Used only by authorized listing workflows; keep existing admin brand management unchanged.
	public async resolveListingBrand(value: string): Promise<Brand> {
		const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
		if (!name || name.length > 60) throw new BadRequestException('Brand must contain 1-60 characters.');
		const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const search = { brandName: new RegExp(`^${escaped}$`, 'i') };
		const existing = await this.brandModel.findOne(search).exec();
		if (existing) {
			if (existing.brandStatus !== BrandStatus.ACTIVE) throw new BadRequestException('This brand is unavailable.');
			return existing;
		}
		// A canonical spelling plus the existing unique name index prevents concurrent agent duplicates.
		try {
			const brand = await this.brandModel.findOneAndUpdate(
				{ brandName: name.toUpperCase() },
				{ $setOnInsert: { brandLogo: '/img/car/placeholder.svg', brandStatus: BrandStatus.ACTIVE } },
				{ upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
			).exec();
			if (!brand || brand.brandStatus !== BrandStatus.ACTIVE) throw new BadRequestException('This brand is unavailable.');
			return brand;
		} catch (error: unknown) {
			if ((error as { code?: number })?.code === 11000) {
				const brand = await this.brandModel.findOne(search).exec();
				if (brand?.brandStatus === BrandStatus.ACTIVE) return brand;
			}
			throw error;
		}
	}

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
