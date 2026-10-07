import { useTranslation } from 'next-i18next';
import { imageUrl } from '../../config';
import { Menu, MenuItem, Stack, Typography } from '@mui/material';
import React, { useState } from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import IconButton from '@mui/material/IconButton';
import ModeIcon from '@mui/icons-material/Mode';
import DeleteIcon from '@mui/icons-material/Delete';
import { Car } from '../../types/car/car';
import { formatterStr } from '../../utils';
import Moment from 'react-moment';
import { useRouter } from 'next/router';
import { CarStatus } from '../../enums/car.enum';

interface CarCardProps {
	car: Car;
	deleteCarHandler?: any;
	memberPage?: boolean;
	updateCarHandler?: any;
}

export const CarCard = (props: CarCardProps) => {
 const { t } = useTranslation('common');
	const { car, deleteCarHandler, memberPage, updateCarHandler } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	/** HANDLERS **/
	const pushEditCar = async (id: string) => {
		console.log('+pushEditCar: ', id);
		await router.push({
			pathname: '/mypage',
			query: { category: 'addCar', carId: id },
		});
	};

	const pushCarDetail = async (id: string) => {
		if (memberPage)
			await router.push({
				pathname: '/car/detail',
				query: { id: id },
			});
		else return;
	};

	const handleClick = (event: any) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
			<Stack className="car-card-box">
				<Stack className="image-box" onClick={() => pushCarDetail(car?._id)}>
					<img src={imageUrl(car.carImages[0])} alt="" />
				</Stack>
				<Stack className="information-box" onClick={() => pushCarDetail(car?._id)}>
					<Typography className="name">{car.carTitle}</Typography>
					<Typography className="address">{car.carAddress}</Typography>
					<Typography className="price">
						<strong>${formatterStr(car?.carPrice)}</strong>
					</Typography>
				</Stack>
				<Stack className="date-box">
					<Typography className="date">
						<Moment format="DD MMMM, YYYY">{car.createdAt}</Moment>
					</Typography>
				</Stack>
				<Stack className="status-box">
					<Stack className="coloured-box" sx={{ background: '#E5F0FD' }} onClick={!memberPage && car.carStatus === CarStatus.ACTIVE ? handleClick : undefined}>
						<Typography className="status" sx={{ color: '#3554d1' }}>
							{car.carStatus}
						</Typography>
					</Stack>
				</Stack>
				{!memberPage && car.carStatus !== 'SOLD' && (
					<Menu
						anchorEl={anchorEl}
						open={open}
						onClose={handleClose}
						PaperProps={{
							elevation: 0,
							sx: {
								width: '70px',
								mt: 1,
								ml: '10px',
								overflow: 'visible',
								filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
							},
							style: {
								padding: 0,
								display: 'flex',
								justifyContent: 'center',
							},
						}}
					>
						{car.carStatus === 'ACTIVE' && (
							<>
								<MenuItem
									disableRipple
									onClick={() => {
										handleClose();
										updateCarHandler(CarStatus.SOLD, car?._id);
									}}
								>{t("Sold")}</MenuItem>
							</>
						)}
					</Menu>
				)}

				<Stack className="views-box">
					<Typography className="views">{car.carViews.toLocaleString()}</Typography>
				</Stack>
				{!memberPage && car.carStatus === CarStatus.ACTIVE && (
					<Stack className="action-box">
						<IconButton aria-label={t("Edit car")} className="icon-button" onClick={() => pushEditCar(car._id)}>
							<ModeIcon className="buttons" />
						</IconButton>
						<IconButton aria-label={t("Delete car")} className="icon-button" onClick={() => deleteCarHandler(car._id)}>
							<DeleteIcon className="buttons" />
						</IconButton>
					</Stack>
				)}
			</Stack>
		);
};
