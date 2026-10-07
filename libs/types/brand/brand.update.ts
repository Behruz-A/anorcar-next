import { BrandStatus } from '../../enums/brand.enum';

export interface BrandUpdate {
	_id: string;
	brandName?: string | null;
	brandLogo?: string | null;
	brandStatus?: BrandStatus | null;
}
