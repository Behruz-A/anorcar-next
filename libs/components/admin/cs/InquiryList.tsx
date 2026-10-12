import React from 'react';
import { useTranslation } from 'next-i18next';
import {
	Button,
	Chip,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { Inquiry } from '../../../types/inquiry/inquiry';
import { InquiryStatus, inquirySubjectLabels } from '../../../enums/inquiry.enum';

interface InquiryListProps {
	inquiries: Inquiry[];
	onOpen: (inquiry: Inquiry) => void;
}
export const inquiryStatusLabels: Record<InquiryStatus, string> = {
	[InquiryStatus.NEW]: 'New',
	[InquiryStatus.READ]: 'Read',
	[InquiryStatus.CLOSED]: 'Closed',
};

export const InquiryList = ({ inquiries, onOpen }: InquiryListProps) => {
	const { t } = useTranslation('common');
	return (
		<TableContainer>
			<Table sx={{ minWidth: 750 }} aria-label={t('Support inquiries')}>
				<TableHead>
					<TableRow>
						{['Subject', 'Message', 'Sender', 'Date', 'Status', 'Actions'].map((label) => (
							<TableCell key={label}>{t(label)}</TableCell>
						))}
					</TableRow>
				</TableHead>
				<TableBody>
					{inquiries.map((inquiry) => (
						<TableRow key={inquiry._id} hover>
							<TableCell>{t(inquirySubjectLabels[inquiry.inquirySubject])}</TableCell>
							<TableCell sx={{ maxWidth: 260 }}>
								<Typography noWrap>{inquiry.inquiryMessage}</Typography>
							</TableCell>
							<TableCell>
								<Typography>{inquiry.inquiryName}</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
									{inquiry.inquiryEmail}
								</Typography>
							</TableCell>
							<TableCell>{new Date(inquiry.createdAt).toLocaleDateString()}</TableCell>
							<TableCell>
								<Chip
									size="small"
									label={t(inquiryStatusLabels[inquiry.inquiryStatus])}
									color={inquiry.inquiryStatus === InquiryStatus.NEW ? 'warning' : 'default'}
								/>
							</TableCell>
							<TableCell>
								<Button onClick={() => onOpen(inquiry)}>{t('View message')}</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};
