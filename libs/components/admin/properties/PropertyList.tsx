import React from 'react';
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
import { Stack } from '@mui/material';
import { Property } from '../../../types/property/property';
import { REACT_APP_API_URL } from '../../../config';
import DeleteIcon from '@mui/icons-material/Delete';
import Typography from '@mui/material/Typography';
import { PropertyStatus } from '../../../enums/property.enum';

interface Data {
	id: string;
	title: string;
	price: string;
	agent: string;
	location: string;
	type: string;
	status: string;
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
		id: 'id',
		numeric: true,
		disablePadding: false,
		label: 'MB ID',
	},
	{
		id: 'title',
		numeric: true,
		disablePadding: false,
		label: 'TITLE',
	},
	{
		id: 'price',
		numeric: false,
		disablePadding: false,
		label: 'PRICE',
	},
	{
		id: 'agent',
		numeric: false,
		disablePadding: false,
		label: 'AGENT',
	},
	{
		id: 'location',
		numeric: false,
		disablePadding: false,
		label: 'LOCATION',
	},
	{
		id: 'type',
		numeric: false,
		disablePadding: false,
		label: 'TYPE',
	},
	{
		id: 'status',
		numeric: false,
		disablePadding: false,
		label: 'STATUS',
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

interface PropertyPanelListType {
	properties: Property[];
	anchorEl: any;
	menuIconClickHandler: any;
	menuIconCloseHandler: any;
	updatePropertyHandler: any;
	removePropertyHandler: any;
}

export const PropertyPanelList = (props: PropertyPanelListType) => {
	const {
		properties,
		anchorEl,
		menuIconClickHandler,
		menuIconCloseHandler,
		updatePropertyHandler,
		removePropertyHandler,
	} = props;

	return (
		<Stack>
			<TableContainer>
				<Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
					{/*@ts-ignore*/}
					<EnhancedTableHead />
					<TableBody>
						{properties.length === 0 && (
							<TableRow>
								<TableCell align="center" colSpan={8}>
									<span className={'no-data'}>data not found!</span>
								</TableCell>
							</TableRow>
						)}

						{properties.length !== 0 &&
							properties.map((property: Property, index: number) => {
								const propertyImage = `${REACT_APP_API_URL}/${property?.propertyImages[0]}`;

								return (
									<TableRow hover key={property?._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
										<TableCell align="left">{property._id}</TableCell>
										<TableCell align="left" className={'name'}>
											{property.propertyStatus === PropertyStatus.ACTIVE ? (
												<Stack direction={'row'}>
													<Link href={`/property/detail?id=${property?._id}`}>
														<div>
															<Avatar alt="Reny Sharp" src={propertyImage} sx={{ ml: '2px', mr: '10px' }} />
														</div>
													</Link>

													<Link href={`/property/detail?id=${property?._id}`}>
														<div>{property.propertyTitle}</div>
													</Link>
												</Stack>
											) : (
												<Stack direction={'row'}>
													<div>
														<Avatar alt="Reny Sharp" src={propertyImage} sx={{ ml: '2px', mr: '10px' }} />
													</div>

													<div style={{ marginTop: '10px' }}>{property.propertyTitle}</div>
												</Stack>
											)}
										</TableCell>
										<TableCell align="center">{property.propertyPrice}</TableCell>
										<TableCell align="center">{property.memberData?.memberNick}</TableCell>
										<TableCell align="center">{property.propertyLocation}</TableCell>
										<TableCell align="center">{property.propertyType}</TableCell>
										<TableCell align="center">
											{property.propertyStatus === PropertyStatus.DELETE && (
												<Button
													variant="outlined"
													sx={{ p: '3px', border: 'none', ':hover': { border: '1px solid #000000' } }}
													onClick={() => removePropertyHandler(property._id)}
												>
													<DeleteIcon fontSize="small" />
												</Button>
											)}

											{property.propertyStatus === PropertyStatus.SOLD && (
												<Button className={'badge warning'}>{property.propertyStatus}</Button>
											)}

											{property.propertyStatus === PropertyStatus.ACTIVE && (
												<>
													<Button onClick={(e: any) => menuIconClickHandler(e, index)} className={'badge success'}>
														{property.propertyStatus}
													</Button>

													<Menu
														className={'menu-modal'}
														MenuListProps={{
															'aria-labelledby': 'fade-button',
														}}
														anchorEl={anchorEl[index]}
														open={Boolean(anchorEl[index])}
														onClose={menuIconCloseHandler}
														TransitionComponent={Fade}
														sx={{ p: 1 }}
													>
														{Object.values(PropertyStatus)
															.filter((ele) => ele !== property.propertyStatus)
															.map((status: string) => (
																<MenuItem
																	onClick={() => updatePropertyHandler({ _id: property._id, propertyStatus: status })}
																	key={status}
																>
																	<Typography variant={'subtitle1'} component={'span'}>
																		{status}
																	</Typography>
																</MenuItem>
															))}
													</Menu>
												</>
											)}
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
