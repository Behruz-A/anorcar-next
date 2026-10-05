import React, { useCallback, useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { MemberPanelList } from '../../../libs/components/admin/users/MemberList';
import { Box, InputAdornment, List, ListItem, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { TabContext } from '@mui/lab';
import OutlinedInput from '@mui/material/OutlinedInput';
import TablePagination from '@mui/material/TablePagination';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { MembersInquiry } from '../../../libs/types/member/member.input';
import { Member } from '../../../libs/types/member/member';
import { MemberStatus, MemberType } from '../../../libs/enums/member.enum';
import { sweetErrorHandling } from '../../../libs/sweetAlert';
import { MemberUpdate } from '../../../libs/types/member/member.update';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_MEMBERS_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { T } from '../../../libs/types/common';

const AdminUsers: NextPage = ({ initialInquiry, ...props }: any) => {
	const [anchorEl, setAnchorEl] = useState<[] | HTMLElement[]>([]);
	const [membersInquiry, setMembersInquiry] = useState<MembersInquiry>(initialInquiry);
	const [members, setMembers] = useState<Member[]>([]);
	const [membersTotal, setMembersTotal] = useState<number>(0);
	const [value, setValue] = useState(
		membersInquiry?.search?.memberStatus ? membersInquiry?.search?.memberStatus : 'ALL',
	);
	const [searchText, setSearchText] = useState('');
	const [searchType, setSearchType] = useState('ALL');

	/** APOLLO REQUESTS **/
	const [updateMemberByAdmin] = useMutation(UPDATE_MEMBER_BY_ADMIN);
	const {
		loading: getAllMembersByAdminLoading,
		data: getAllMembersByAdminData,
		error: getAllMembersByAdminError,
		refetch: getAllMembersRefetch,
	} = useQuery(GET_ALL_MEMBERS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: membersInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMembers(data?.getAllMembersByAdmin?.list);
			setMembersTotal(data?.getAllMembersByAdmin?.metaCounter[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		getAllMembersRefetch({ input: membersInquiry }).then();
	}, [membersInquiry]);

	/** HANDLERS **/
	const changePageHandler = async (event: unknown, newPage: number) => {
		membersInquiry.page = newPage + 1;
		await getAllMembersRefetch({ input: membersInquiry });
		setMembersInquiry({ ...membersInquiry });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		membersInquiry.limit = parseInt(event.target.value, 10);
		membersInquiry.page = 1;
		await getAllMembersRefetch({ input: membersInquiry });
		setMembersInquiry({ ...membersInquiry });
	};

	const menuIconClickHandler = (e: any, index: number) => {
		const tempAnchor = anchorEl.slice();
		tempAnchor[index] = e.currentTarget;
		setAnchorEl(tempAnchor);
	};

	const menuIconCloseHandler = () => {
		setAnchorEl([]);
	};

	const tabChangeHandler = async (event: any, newValue: string) => {
		setValue(newValue);
		setSearchText('');

		setMembersInquiry({ ...membersInquiry, page: 1, sort: 'createdAt' });

		switch (newValue) {
			case 'ACTIVE':
				setMembersInquiry({ ...membersInquiry, search: { memberStatus: MemberStatus.ACTIVE } });
				break;
			case 'BLOCK':
				setMembersInquiry({ ...membersInquiry, search: { memberStatus: MemberStatus.BLOCK } });
				break;
			case 'DELETE':
				setMembersInquiry({ ...membersInquiry, search: { memberStatus: MemberStatus.DELETE } });
				break;
			default:
				delete membersInquiry?.search?.memberStatus;
				setMembersInquiry({ ...membersInquiry });
				break;
		}
	};

	const updateMemberHandler = async (updateData: MemberUpdate) => {
		try {
			await updateMemberByAdmin({
				variables: {
					input: updateData,
				},
			});

			menuIconCloseHandler();
			await getAllMembersRefetch({ input: membersInquiry });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const textHandler = useCallback((value: string) => {
		try {
			setSearchText(value);
		} catch (err: any) {
			console.log('textHandler: ', err.message);
		}
	}, []);

	const searchTextHandler = () => {
		try {
			setMembersInquiry({
				...membersInquiry,
				search: {
					...membersInquiry.search,
					text: searchText,
				},
			});
		} catch (err: any) {
			console.log('searchTextHandler: ', err.message);
		}
	};

	const searchTypeHandler = async (newValue: string) => {
		try {
			setSearchType(newValue);

			if (newValue !== 'ALL') {
				setMembersInquiry({
					...membersInquiry,
					page: 1,
					sort: 'createdAt',
					search: {
						...membersInquiry.search,
						memberType: newValue as MemberType,
					},
				});
			} else {
				delete membersInquiry?.search?.memberType;
				setMembersInquiry({ ...membersInquiry });
			}
		} catch (err: any) {
			console.log('searchTypeHandler: ', err.message);
		}
	};

	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				Member List
			</Typography>
			<Box component={'div'} className={'table-wrap'}>
				<Box component={'div'} sx={{ width: '100%', typography: 'body1' }}>
					<TabContext value={value}>
						<Box component={'div'}>
							<List className={'tab-menu'}>
								<ListItem
									onClick={(e) => tabChangeHandler(e, 'ALL')}
									value="ALL"
									className={value === 'ALL' ? 'li on' : 'li'}
								>
									All
								</ListItem>
								<ListItem
									onClick={(e) => tabChangeHandler(e, 'ACTIVE')}
									value="ACTIVE"
									className={value === 'ACTIVE' ? 'li on' : 'li'}
								>
									Active
								</ListItem>
								<ListItem
									onClick={(e) => tabChangeHandler(e, 'BLOCK')}
									value="BLOCK"
									className={value === 'BLOCK' ? 'li on' : 'li'}
								>
									Blocked
								</ListItem>
								<ListItem
									onClick={(e) => tabChangeHandler(e, 'DELETE')}
									value="DELETE"
									className={value === 'DELETE' ? 'li on' : 'li'}
								>
									Deleted
								</ListItem>
							</List>
							<Divider />
							<Stack className={'search-area'} sx={{ m: '24px' }}>
								<OutlinedInput
									value={searchText}
									onChange={(e: any) => textHandler(e.target.value)}
									sx={{ width: '100%' }}
									className={'search'}
									placeholder="Search user name"
									onKeyDown={(event) => {
										if (event.key == 'Enter') searchTextHandler();
									}}
									endAdornment={
										<>
											{searchText && (
												<CancelRoundedIcon
													style={{ cursor: 'pointer' }}
													onClick={async () => {
														setSearchText('');
														setMembersInquiry({
															...membersInquiry,
															search: {
																...membersInquiry.search,
																text: '',
															},
														});
														await getAllMembersRefetch({ input: membersInquiry });
													}}
												/>
											)}
											<InputAdornment position="end" onClick={() => searchTextHandler()}>
												<img src="/img/icons/search_icon.png" alt={'searchIcon'} />
											</InputAdornment>
										</>
									}
								/>
								<Select sx={{ width: '160px', ml: '20px' }} value={searchType}>
									<MenuItem value={'ALL'} onClick={() => searchTypeHandler('ALL')}>
										All
									</MenuItem>
									<MenuItem value={'USER'} onClick={() => searchTypeHandler('USER')}>
										User
									</MenuItem>
									<MenuItem value={'AGENT'} onClick={() => searchTypeHandler('AGENT')}>
										Agent
									</MenuItem>
									<MenuItem value={'ADMIN'} onClick={() => searchTypeHandler('ADMIN')}>
										Admin
									</MenuItem>
								</Select>
							</Stack>
							<Divider />
						</Box>
						<MemberPanelList
							members={members}
							anchorEl={anchorEl}
							menuIconClickHandler={menuIconClickHandler}
							menuIconCloseHandler={menuIconCloseHandler}
							updateMemberHandler={updateMemberHandler}
						/>

						<TablePagination
							rowsPerPageOptions={[10, 20, 40, 60]}
							component="div"
							count={membersTotal}
							rowsPerPage={membersInquiry?.limit}
							page={membersInquiry?.page - 1}
							onPageChange={changePageHandler}
							onRowsPerPageChange={changeRowsPerPageHandler}
						/>
					</TabContext>
				</Box>
			</Box>
		</Box>
	);
};

AdminUsers.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		search: {},
	},
};

export default withAdminLayout(AdminUsers);
