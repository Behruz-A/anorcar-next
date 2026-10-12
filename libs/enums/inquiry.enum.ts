export enum InquirySubject {
	BUYING_CAR = 'BUYING_CAR',
	SELLING_CAR = 'SELLING_CAR',
	MY_ACCOUNT = 'MY_ACCOUNT',
	TECHNICAL_SUPPORT = 'TECHNICAL_SUPPORT',
	COMMUNITY = 'COMMUNITY',
}

export enum InquiryStatus {
	NEW = 'NEW',
	READ = 'READ',
	CLOSED = 'CLOSED',
}

export const inquirySubjectLabels: Record<InquirySubject, string> = {
	[InquirySubject.BUYING_CAR]: 'Buying a car',
	[InquirySubject.SELLING_CAR]: 'Selling a car',
	[InquirySubject.MY_ACCOUNT]: 'My account',
	[InquirySubject.TECHNICAL_SUPPORT]: 'Technical support',
	[InquirySubject.COMMUNITY]: 'Community',
};
