import React, { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	MenuItem,
	Stack,
	TablePagination,
	TextField,
	Typography,
} from '@mui/material';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { InquiryList, inquiryStatusLabels } from '../../../libs/components/admin/cs/InquiryList';
import { GET_ALL_INQUIRIES_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_INQUIRY_BY_ADMIN } from '../../../apollo/admin/mutation';
import { userVar } from '../../../apollo/store';
import { MemberType } from '../../../libs/enums/member.enum';
import { InquiryStatus, inquirySubjectLabels } from '../../../libs/enums/inquiry.enum';
import { AllInquiriesInquiry, Inquiries, Inquiry, InquiryUpdate } from '../../../libs/types/inquiry/inquiry';

function InquiryArticles() {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [input, setInput] = useState<AllInquiriesInquiry>({ page: 1, limit: 20 });
	const [search, setSearch] = useState('');
	const [selected, setSelected] = useState<Inquiry | null>(null);
	const [updateError, setUpdateError] = useState(false);
	const { data, loading, error, refetch } = useQuery<
		{ getAllInquiriesByAdmin: Inquiries },
		{ input: AllInquiriesInquiry }
	>(GET_ALL_INQUIRIES_BY_ADMIN, {
		variables: { input },
		skip: user.memberType !== MemberType.ADMIN,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const [updateInquiry, { loading: updating }] = useMutation<
		{ updateInquiryByAdmin: Pick<Inquiry, '_id' | 'inquiryStatus' | 'updatedAt'> },
		{ input: InquiryUpdate }
	>(UPDATE_INQUIRY_BY_ADMIN);
	const result = data?.getAllInquiriesByAdmin;
	const total = result?.metaCounter[0]?.total ?? 0;
	useEffect(() => {
		if (loading || error || !result) return;
		const lastPage = Math.max(1, Math.ceil(total / input.limit));
		if (input.page > lastPage) setInput((current) => ({ ...current, page: lastPage }));
	}, [loading, error, result, total, input.limit, input.page]);
	const searchHandler = (event: FormEvent) => {
		event.preventDefault();
		setInput({ ...input, page: 1, text: search.trim() || undefined });
	};
	const updateStatus = async (inquiryStatus: InquiryStatus) => {
		if (!selected || updating) return;
		setUpdateError(false);
		try {
			const response = await updateInquiry({ variables: { input: { _id: selected._id, inquiryStatus } } });
			if (!response.data?.updateInquiryByAdmin) throw new Error('Missing updated inquiry');
			setSelected({ ...selected, ...response.data.updateInquiryByAdmin });
		} catch {
			setUpdateError(true);
			return;
		}
		// Query errors are displayed by the list without misreporting a saved status as failed.
		await refetch().catch(() => undefined);
	};
	return (
		<div className="content">
			<Typography variant="h4" sx={{ mb: 3 }}>
				{t('Support inquiries')}
			</Typography>
			<div className="table-wrap">
				<Stack direction="row" spacing={2} sx={{ p: 3, flexWrap: 'wrap', gap: 2 }}>
					<TextField
						select
						label={t('Status')}
						value={input.inquiryStatus ?? 'ALL'}
						onChange={(event) =>
							setInput({
								...input,
								page: 1,
								inquiryStatus: event.target.value === 'ALL' ? undefined : (event.target.value as InquiryStatus),
							})
						}
						sx={{ minWidth: 160 }}
					>
						<MenuItem value="ALL">{t('All inquiries')}</MenuItem>
						{Object.values(InquiryStatus).map((status) => (
							<MenuItem key={status} value={status}>
								{t(inquiryStatusLabels[status])}
							</MenuItem>
						))}
					</TextField>
					<form onSubmit={searchHandler} style={{ display: 'flex', gap: 8, flex: 1 }}>
						<TextField
							label={t('Search name, email or message')}
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							inputProps={{ maxLength: 100 }}
							fullWidth
						/>
						<Button type="submit">{t('Search')}</Button>
						<Button
							onClick={() => {
								setSearch('');
								setInput({ ...input, page: 1, text: undefined });
							}}
						>
							{t('Clear')}
						</Button>
					</form>
					<Button
						onClick={() => {
							void refetch();
						}}
						disabled={loading}
					>
						{t('Refresh')}
					</Button>
				</Stack>
				{loading && (
					<div style={{ padding: 24 }}>
						<CircularProgress size={24} aria-label={t('Loading')} />
					</div>
				)}
				{error && (
					<Alert
						severity="error"
						action={
							<Button
								onClick={() => {
									void refetch();
								}}
							>
								{t('Retry')}
							</Button>
						}
					>
						{t('Inquiries could not be loaded.')}
					</Alert>
				)}
				{!error && !loading && (
					<>
						<InquiryList
							inquiries={result?.list ?? []}
							onOpen={(inquiry) => {
								setSelected(inquiry);
								setUpdateError(false);
							}}
						/>
						{!result?.list.length && <Alert severity="info">{t('No inquiries found.')}</Alert>}
					</>
				)}
				<TablePagination
					rowsPerPageOptions={[20, 40, 60]}
					component="div"
					count={total}
					rowsPerPage={input.limit}
					page={input.page - 1}
					onPageChange={(_, page) => setInput({ ...input, page: page + 1 })}
					onRowsPerPageChange={(event) => setInput({ ...input, page: 1, limit: Number(event.target.value) })}
				/>
			</div>
			<Dialog
				open={Boolean(selected)}
				onClose={() => {
					if (!updating) setSelected(null);
				}}
				fullWidth
				maxWidth="sm"
				aria-labelledby="admin-inquiry-title"
			>
				<DialogTitle id="admin-inquiry-title">{t('Support inquiry')}</DialogTitle>
				<DialogContent dividers>
					{selected && (
						<Stack spacing={2}>
							<Typography>
								<strong>{t('Subject')}:</strong> {t(inquirySubjectLabels[selected.inquirySubject])}
							</Typography>
							<Typography sx={{ overflowWrap: 'anywhere' }}>
								<strong>{t('Sender')}:</strong> {selected.inquiryName} ({selected.inquiryEmail})
							</Typography>
							<Typography>
								<strong>{t('Date')}:</strong> {new Date(selected.createdAt).toLocaleString()}
							</Typography>
							<Typography>
								<strong>{t('Status')}:</strong> {t(inquiryStatusLabels[selected.inquiryStatus])}
							</Typography>
							<Typography
								sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', bgcolor: '#F9FAFB', p: 2, borderRadius: 1 }}
							>
								{selected.inquiryMessage}
							</Typography>
							{updateError && (
								<Alert severity="error">{t('Inquiry status could not be updated. Please try again.')}</Alert>
							)}
						</Stack>
					)}
				</DialogContent>
				<DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
					<Button disabled={updating} onClick={() => setSelected(null)}>
						{t('Close')}
					</Button>
					{selected?.inquiryStatus === InquiryStatus.NEW && (
						<Button
							disabled={updating}
							onClick={() => {
								void updateStatus(InquiryStatus.READ);
							}}
						>
							{t('Mark as read')}
						</Button>
					)}
					<Button
						disabled={updating}
						onClick={() => {
							void updateStatus(
								selected?.inquiryStatus === InquiryStatus.CLOSED ? InquiryStatus.NEW : InquiryStatus.CLOSED,
							);
						}}
					>
						{t(selected?.inquiryStatus === InquiryStatus.CLOSED ? 'Reopen inquiry' : 'Close inquiry')}
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
export default withAdminLayout(InquiryArticles);
