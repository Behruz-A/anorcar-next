import { InquiryStatus, InquirySubject } from '../../enums/inquiry.enum';

export interface InquiryInput {
	inquiryName: string;
	inquiryEmail: string;
	inquirySubject: InquirySubject;
	inquiryMessage: string;
}

export interface Inquiry extends InquiryInput {
	_id: string;
	memberId: string;
	inquiryStatus: InquiryStatus;
	createdAt: string;
	updatedAt: string;
}

export interface Inquiries {
	list: Inquiry[];
	metaCounter: { total: number }[];
}

export interface AllInquiriesInquiry {
	page: number;
	limit: number;
	inquiryStatus?: InquiryStatus;
	text?: string;
}

export interface InquiryUpdate {
	_id: string;
	inquiryStatus: InquiryStatus;
}
