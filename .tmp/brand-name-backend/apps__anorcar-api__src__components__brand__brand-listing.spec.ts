import 'reflect-metadata';
import { BrandService } from './brand.service';
import { BrandStatus } from '../../libs/enums/brand.enum';
import { CarService } from '../car/car.service';
import { CarStatus } from '../../libs/enums/car.enum';
import { Types } from 'mongoose';

const active={_id:new Types.ObjectId(),brandName:'Hyundai',brandStatus:BrandStatus.ACTIVE};
const query=(value:unknown)=>({exec:jest.fn().mockResolvedValue(value)});
const setup=()=>{
 const model={findOne:jest.fn((search: {brandName:RegExp})=>query(null)),findOneAndUpdate:jest.fn((...args:unknown[])=>query(active))};
 const service=new BrandService(model as never);
 return {model,service};
};
describe('Listing brand resolution',()=>{
 it('reuses existing names regardless of case without modifying logos/status',async()=>{
  const {model,service}=setup(); model.findOne.mockReturnValue(query(active));
  expect(await service.resolveListingBrand('  hyundai  ')).toBe(active);
  expect(model.findOne.mock.calls[0][0].brandName.test('Hyundai')).toBe(true);
  expect(model.findOneAndUpdate).not.toHaveBeenCalled();
 });
 it('creates new names using canonical upsert and a placeholder',async()=>{
  const {model,service}=setup(); await service.resolveListingBrand('  Toyota  ');
  expect(model.findOneAndUpdate).toHaveBeenCalledWith({brandName:'TOYOTA'},{$setOnInsert:{brandLogo:'/img/car/placeholder.svg',brandStatus:BrandStatus.ACTIVE}},expect.objectContaining({upsert:true,new:true,runValidators:true}));
 });
 it('treats regex punctuation as literal brand text',async()=>{
  const {model,service}=setup(); await service.resolveListingBrand('A+B (Cars)');
  const regex=model.findOne.mock.calls[0][0].brandName;
  expect(regex.test('A+B (Cars)')).toBe(true); expect(regex.test('AAAB Cars')).toBe(false);
 });
 it('does not reactivate deleted brands',async()=>{
  const {model,service}=setup();model.findOne.mockReturnValue(query({...active,brandStatus:BrandStatus.DELETE}));
  await expect(service.resolveListingBrand('Hyundai')).rejects.toThrow('unavailable');expect(model.findOneAndUpdate).not.toHaveBeenCalled();
 });
 it.each(['', '   ', 'a'.repeat(61)])('rejects blank/long names',async(name)=>{
  const {model,service}=setup();await expect(service.resolveListingBrand(name)).rejects.toThrow();expect(model.findOne).not.toHaveBeenCalled();
 });
 it('recovers a concurrent unique-name collision',async()=>{
  const {model,service}=setup(); model.findOne.mockReturnValueOnce(query(null)).mockReturnValueOnce(query(active));
  model.findOneAndUpdate.mockReturnValue({exec:jest.fn().mockRejectedValue({code:11000})});
  expect(await service.resolveListingBrand('Hyundai')).toBe(active);
 });
});
describe('Car brand persistence and ownership',()=>{
 const create=()=>{
  const memberId=new Types.ObjectId();
  const model={create:jest.fn(async(input:unknown)=>({...input as object,memberId})),exists:jest.fn().mockResolvedValue(null),findOneAndUpdate:jest.fn(()=>query({_id:new Types.ObjectId()}))};
  const brand={resolveListingBrand:jest.fn().mockResolvedValue(active),getBrand:jest.fn().mockResolvedValue(active)};
  const member={memberStatsEditor:jest.fn()};
  const service=new CarService(model as never,member as never,{} as never,{} as never,brand as never);
  return{service,model,brand,memberId};
 };
 it('saves real brandId and omits transient brandName',async()=>{
  const {service,model}=create(); await service.createCar({brandName:'BMW'} as never);
  expect(model.create).toHaveBeenCalledWith(expect.objectContaining({brandId:active._id}));
  expect(model.create.mock.calls[0][0]).not.toHaveProperty('brandName');
 });
 it('keeps legacy brand ID inputs',async()=>{
  const {service,brand}=create();await service.createCar({brandId:active._id} as never);
  expect(brand.getBrand).toHaveBeenCalled();expect(brand.resolveListingBrand).not.toHaveBeenCalled();
 });
 it('rejects ambiguous name and ID',async()=>{
  const {service,model}=create();await expect(service.createCar({brandId:active._id,brandName:'BMW'} as never)).rejects.toThrow('either');expect(model.create).not.toHaveBeenCalled();
 });
 it('does not create a brand for an unauthorized/missing listing update',async()=>{
  const {service,brand,memberId}=create();await expect(service.updateCar(memberId as never,{_id:new Types.ObjectId(),brandName:'BMW'} as never)).rejects.toThrow();
  expect(brand.resolveListingBrand).not.toHaveBeenCalled();
 });
 it('checks active ownership before resolving a brand for updates',async()=>{
  const {service,model,brand,memberId}=create();model.exists.mockResolvedValue({_id:new Types.ObjectId()});
  await service.updateCar(memberId as never,{_id:new Types.ObjectId(),brandName:'BMW'} as never);
  expect(model.exists).toHaveBeenCalledWith(expect.objectContaining({memberId,carStatus:CarStatus.ACTIVE}));expect(brand.resolveListingBrand).toHaveBeenCalledWith('BMW');
 });
});
