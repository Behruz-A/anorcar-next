import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
	TableCell,
	TableHead,
	TableBody,
	TableRow,
	Table,
	TableContainer,
	Button,
	Menu,
	Fade,
	MenuItem,
} from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { Stack } from '@mui/material';

interface Data {
	category: string;
	qna_case_status: string;
	title: string;
	writer: string;
	date: string;
	status: string;
	id?: string;
}

type Order = 'asc' | 'desc';

interface HeadCell {
	disablePadding: boolean;
	id: keyof Data;
	label: string;
	numeric: boolean;
}

const headCells: readonly HeadCell[] = [
	{
		id: 'category',
		numeric: true,
		disablePadding: false,
		label: 'CATEGORY',
	},
	{
		id: 'title',
		numeric: true,
		disablePadding: false,
		label: 'TITLE',
	},
	{
		id: 'writer',
		numeric: true,
		disablePadding: false,
		label: 'WRITER',
	},
	{
		id: 'date',
		numeric: true,
		disablePadding: false,
		label: 'DATE',
	},
	{
		id: 'qna_case_status',
		numeric: false,
		disablePadding: false,
		label: 'QNA STATUS',
	},
];

interface EnhancedTableProps {
	numSelected: number;
	onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
	onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
	order: Order;
	orderBy: string;
	rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
	const { onSelectAllClick } = props;

	return (
		<TableHead>
			<TableRow>
				{headCells.map((headCell) => (
					<TableCell
						key={headCell.id}
						align={headCell.numeric ? 'left' : 'center'}
						padding={headCell.disablePadding ? 'none' : 'normal'}
					>
						{headCell.label}
					</TableCell>
				))}
			</TableRow>
		</TableHead>
	);
}

interface InquiryPanelListType {
	dense?: boolean;
	membersData?: any;
	searchMembers?: any;
	anchorEl?: any;
	handleMenuIconClick?: any;
	handleMenuIconClose?: any;
	generateMentorTypeHandle?: any;
}

export const InquiryList = (props: InquiryPanelListType) => {
	const {
		dense,
		membersData,
		searchMembers,
		anchorEl,
		handleMenuIconClick,
		handleMenuIconClose,
		generateMentorTypeHandle,
	} = props;
	const router = useRouter();

	/** APOLLO REQUESTS **/
	/** LIFECYCLES **/
	/** HANDLERS **/

	return (
		<Stack>
			<TableContainer>
				<Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={dense ? 'small' : 'medium'}>
					{/*@ts-ignore*/}
					<EnhancedTableHead />
					<TableBody>
						{[1, 2, 3, 4, 5].map((ele: any, index: number) => {
							const member_image = '/img/profile/defaultUser.svg';

							let status_class_name = '';

							return (
								<TableRow hover key={'member._id'} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
									<TableCell align="left">mb id</TableCell>
									<TableCell align="left">member.mb_full_name</TableCell>
									<TableCell align="left" className={'name'}>
										<Stack direction={'row'}>
											<Link href={`/_admin/users/detail?mb_id=$'{member._id'}`}>
												<div>
													<Avatar alt="Remy Sharp" src={member_image} sx={{ ml: '2px', mr: '10px' }} />
												</div>
											</Link>
											<Link href={`/_admin/users/detail?mb_id=${'member._id'}`}>
												<div>member.mb_nick</div>
											</Link>
										</Stack>
									</TableCell>
									<TableCell align="left">member.mb_phone</TableCell>
									<TableCell align="center">
										<Button onClick={(e: any) => handleMenuIconClick(e, index)} className={'badge success'}>
											member.mb_type
										</Button>

										<Menu
											className={'menu-modal'}
											MenuListProps={{
												'aria-labelledby': 'fade-button',
											}}
											anchorEl={anchorEl[index]}
											open={Boolean(anchorEl[index])}
											onClose={handleMenuIconClose}
											TransitionComponent={Fade}
											sx={{ p: 1 }}
										>
											<MenuItem onClick={(e) => generateMentorTypeHandle('member._id', 'mentor', 'originate')}>
												<Typography variant={'subtitle1'} component={'span'}>
													MENTOR
												</Typography>
											</MenuItem>
											<MenuItem onClick={(e) => generateMentorTypeHandle('member._id', 'user', 'remove')}>
												<Typography variant={'subtitle1'} component={'span'}>
													USER
												</Typography>
											</MenuItem>
										</Menu>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>
		</Stack>
	);
};
