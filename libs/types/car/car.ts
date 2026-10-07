import { CarLocation, CarStatus, CarFuelType, CarCondition, CarTransmission } from '../../enums/car.enum';
import { Member } from '../member/member';
import { Brand } from '../brand/brand';
export interface MeLiked { memberId: string; likeRefId: string; myFavorite: boolean; }
export interface TotalCounter { total?: number | null; }

export interface Car {
 _id: string;
 carStatus: CarStatus;
 carFuelType: CarFuelType;
 carCondition: CarCondition;
 carModel: string;
 carYear: number;
 carLocation: CarLocation;
 carAddress: string;
 carTransmission: CarTransmission;
 carTitle: string;
 carPrice: number;
 carColor: string;
 carViews: number;
 carLikes: number;
 carComments: number;
 carRank: number;
 carImages: string[];
 brandId: string;
 carDesc?: string | null;
 carBarter: boolean;
 carRent: boolean;
 memberId: string;
 soldAt?: string | null;
 deletedAt?: string | null;
 createdAt: string;
 updatedAt: string;
 meLiked?: MeLiked[] | null;
 memberData?: Member | null;
 brandData?: Brand | null;
}
export interface Cars { list: Car[]; metaCounter?: TotalCounter[] | null; }
