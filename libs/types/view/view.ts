import { ViewGroup } from '../../enums/view.enum';

export interface View {
	_id: string;
	viewGroup: ViewGroup;
	viewRefId: string;
	memberId: string;
	createdAt: Date;
	updatedAt: Date;
}
