import React from 'react';
import Link from 'next/link';
import {
	Avatar,
	IconButton,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { formatPrice } from '../../../currency';
import { imageUrl } from '../../../config';
import { Car } from '../../../types/car/car';
import { CarUpdate } from '../../../types/car/car.update';
import { CarStatus } from '../../../enums/car.enum';

interface CarPanelListProps {
	cars: Car[];
	pending?: boolean;
	updateCarHandler: (input: CarUpdate) => Promise<void>;
	removeCarHandler: (id: string) => Promise<void>;
}

export const CarPanelList = ({ cars, pending, updateCarHandler, removeCarHandler }: CarPanelListProps) => (
	<TableContainer>
		<Table sx={{ minWidth: 900 }} aria-label="Cars">
			<TableHead>
				<TableRow>
					{['Car', 'Price', 'Seller', 'Location', 'Model', 'Status', 'Actions'].map((label) => (
						<TableCell key={label}>{label}</TableCell>
					))}
				</TableRow>
			</TableHead>
			<TableBody>
				{cars.length === 0 && (
					<TableRow>
						<TableCell colSpan={7} align="center">
							No cars found.
						</TableCell>
					</TableRow>
				)}
				{cars.map((car) => {
					const title = (
						<>
							<Avatar variant="rounded" src={imageUrl(car.carImages?.[0])} alt={car.carTitle} />
							<span>
								<strong>{car.carTitle}</strong>
								<small title={car._id}>#{car._id.slice(-6)}</small>
							</span>
						</>
					);
					return (
						<TableRow hover key={car._id}>
							<TableCell>
								{car.carStatus === CarStatus.ACTIVE ? (
									<Link className="admin-member-name admin-car-name" href={`/car/detail?id=${car._id}`}>
										{title}
									</Link>
								) : (
									<div className="admin-member-name admin-car-name">{title}</div>
								)}
							</TableCell>
							<TableCell>{formatPrice(car.carPrice)}</TableCell>
							<TableCell>{car.memberData?.memberNick || '—'}</TableCell>
							<TableCell>{car.carLocation}</TableCell>
							<TableCell>{car.carModel}</TableCell>
							<TableCell>
								<Select
									size="small"
									className={`admin-pill status-${car.carStatus}`}
									value={car.carStatus}
									disabled={pending || car.carStatus === CarStatus.DELETE}
									inputProps={{ 'aria-label': `Status for ${car.carTitle}` }}
									onChange={(e) => {
										if (e.target.value !== car.carStatus)
											void updateCarHandler({ _id: car._id, carStatus: e.target.value as CarStatus });
									}}
								>
									{Object.values(CarStatus).filter(status => car.carStatus !== CarStatus.SOLD || status !== CarStatus.DELETE).map((status) => (
										<MenuItem key={status} value={status}>
											{status === CarStatus.DELETE ? 'Deleted' : status === CarStatus.SOLD ? 'Sold' : 'Active'}
										</MenuItem>
									))}
								</Select>
							</TableCell>
							<TableCell>
								{car.carStatus === CarStatus.DELETE ? (
									<IconButton
										disabled={pending}
										aria-label={`Permanently remove ${car.carTitle}`}
										onClick={() => void removeCarHandler(car._id)}
									>
										<DeleteOutlineIcon fontSize="small" />
									</IconButton>
								) : (
									'—'
								)}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	</TableContainer>
);
