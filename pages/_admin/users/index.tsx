import React, { useEffect, useRef, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	MenuItem,
	Stack,
	Tab,
	Tabs,
	TablePagination,
	TextField,
} from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { MemberPanelList } from '../../../libs/components/admin/users/MemberList';
import { MembersInquiry } from '../../../libs/types/member/member.input';
import { Members } from '../../../libs/types/member/member';
import { MemberUpdate } from '../../../libs/types/member/member.update';
import { MemberType } from '../../../libs/enums/member.enum';
import { GET_ALL_MEMBERS_BY_ADMIN, GET_ADMIN_MEMBER_OVERVIEW } from '../../../apollo/admin/query';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { userVar, authReadyVar } from '../../../apollo/store';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';

const AdminUsers: NextPage = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar),
		ready = useReactiveVar(authReadyVar);
	const [membersInquiry, setMembersInquiry] = useState<MembersInquiry>({
		page: 1,
		limit: 10,
		search: {},
	});
	const [searchText, setSearchText] = useState('');
	const [pending, setPending] = useState(false);
	const busy = useRef(false);
	const routeType = Object.values(MemberType).includes(router.query.memberType as MemberType)
		? (router.query.memberType as MemberType)
		: undefined;
	const skip =
		!ready || user.memberType !== MemberType.ADMIN || !router.isReady || membersInquiry.search.memberType !== routeType;
	const { data, loading, error, refetch } = useQuery<{ getAllMembersByAdmin: Members }>(GET_ALL_MEMBERS_BY_ADMIN, {
		variables: { input: membersInquiry },
		skip,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const {
		data: overview,
		error: overviewError,
		refetch: refetchOverview,
	} = useQuery(GET_ADMIN_MEMBER_OVERVIEW, { skip, fetchPolicy: 'network-only' });
	const [updateMemberByAdmin] = useMutation(UPDATE_MEMBER_BY_ADMIN);
	const members = data?.getAllMembersByAdmin.list ?? [];
	const total = data?.getAllMembersByAdmin.metaCounter?.[0]?.total ?? 0;
	const agents = router.query.memberType === MemberType.AGENT;
	const count = (key: string) => (overviewError ? '—' : overview?.[key]?.metaCounter?.[0]?.total ?? '—');

	/** LIFECYCLES **/
	useEffect(() => {
		if (!router.isReady) return;
		setMembersInquiry((input) => ({ ...input, page: 1, search: { ...input.search, memberType: routeType } }));
	}, [router.isReady, routeType]);

	/** HANDLERS **/
	const updateMemberHandler = async (input: MemberUpdate) => {
		if (busy.current) return;
		busy.current = true;
		setPending(true);
		try {
			if (
				!(await sweetConfirmAlert(
					`Change member ${input.memberStatus ? 'status' : 'type'} to ${input.memberStatus ?? input.memberType}?`,
				))
			)
				return;
			await updateMemberByAdmin({ variables: { input } });
			const result = await refetch();
			await refetchOverview();
			const remaining = result.data.getAllMembersByAdmin.metaCounter?.[0]?.total ?? 0;
			if (membersInquiry.page > 1 && (membersInquiry.page - 1) * membersInquiry.limit >= remaining)
				setMembersInquiry((value) => ({ ...value, page: Math.max(1, value.page - 1) }));
		} catch (error) {
			await sweetErrorHandling(error);
		} finally {
			busy.current = false;
			setPending(false);
		}
	};
	const search = (event: React.FormEvent) => {
		event.preventDefault();
		setMembersInquiry((value) => ({
			...value,
			page: 1,
			search: { ...value.search, text: searchText.trim() || undefined },
		}));
	};

	return (
		<Box component="div" className="content">
			<div className="admin-page-heading">
				<div>
					<h1>{agents ? 'Agents' : 'Member List'}</h1>
					<p>Manage member types and account statuses using the controls in each row.</p>
				</div>
				<span className="admin-total">{total} members</span>
			</div>
			<div className="admin-metrics">
				{[
					{ key: 'total', label: 'Total members', text: 'All registered accounts' },
					{ key: 'agents', label: 'Agents', text: 'Marketplace agent accounts' },
					{ key: 'active', label: 'Active', text: 'Active member accounts' },
					{ key: 'blocked', label: 'Blocked', text: 'Blocked member accounts' },
				].map((metric) => (
					<div key={metric.key}>
						<span>{metric.label}</span>
						<strong>{count(metric.key)}</strong>
						<small>{metric.text}</small>
					</div>
				))}
			</div>
			<Tabs
				value={membersInquiry.search.memberStatus ?? 'ALL'}
				onChange={(_, value) =>
					setMembersInquiry((input) => ({
						...input,
						page: 1,
						search: { ...input.search, memberStatus: value === 'ALL' ? undefined : value },
					}))
				}
				aria-label="Member status filters"
			>
				<Tab value="ALL" label="All" />
				<Tab value="ACTIVE" label="Active" />
				<Tab value="BLOCK" label="Blocked" />
				<Tab value="DELETE" label="Deleted" />
			</Tabs>
			<Stack component="form" className="admin-filters" onSubmit={search}>
				<TextField
					select
					size="small"
					label="Member type"
					value={membersInquiry.search.memberType ?? 'ALL'}
					onChange={(e) => {
						void router.replace(
							{ pathname: '/_admin/users', query: e.target.value === 'ALL' ? {} : { memberType: e.target.value } },
							undefined,
							{ shallow: true },
						);
					}}
				>
					<MenuItem value="ALL">All member types</MenuItem>
					{Object.values(MemberType).map((type) => (
						<MenuItem key={type} value={type}>
							{type}
						</MenuItem>
					))}
				</TextField>
				<TextField
					className="admin-search"
					size="small"
					label="Search by nickname"
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
				/>
				<Button type="submit" variant="outlined" disabled={loading}>
					Search
				</Button>
				<Button
					type="button"
					onClick={() => {
						setSearchText('');
						setMembersInquiry((input) => ({ ...input, page: 1, search: { memberType: routeType } }));
					}}
				>
					Reset
				</Button>
			</Stack>
			{loading && (
				<div className="admin-status">
					<CircularProgress size={24} aria-label="Loading members" />
				</div>
			)}
			{error && (
				<Alert severity="error">
					Members could not be loaded. <Button onClick={() => void refetch()}>Retry</Button>
				</Alert>
			)}
			<div className="admin-table-panel" aria-busy={pending}>
				{!error && (
					<MemberPanelList members={members} pending={pending || loading} updateMemberHandler={updateMemberHandler} />
				)}
				<TablePagination
					component="div"
					count={total}
					page={membersInquiry.page - 1}
					rowsPerPage={membersInquiry.limit}
					rowsPerPageOptions={[10, 20, 40, 60]}
					onPageChange={(_, page) => setMembersInquiry((input) => ({ ...input, page: page + 1 }))}
					onRowsPerPageChange={(e) =>
						setMembersInquiry((input) => ({ ...input, page: 1, limit: Number(e.target.value) }))
					}
				/>
			</div>
		</Box>
	);
};

export default withAdminLayout(AdminUsers);
