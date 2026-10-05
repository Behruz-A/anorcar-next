import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { PropertyLocation, PropertyType } from '../../enums/property.enum';
import { REACT_APP_API_URL, propertySquare } from '../../config';
import { PropertyInput } from '../../types/property/property.input';
import axios from 'axios';
import { getJwtToken } from '../../auth';
import { userVar } from '../../../apollo/store';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { CREATE_PROPERTY, UPDATE_PROPERTY } from '../../../apollo/user/mutation';
import { GET_PROPERTY } from '../../../apollo/user/query';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';

const AddProperty = ({ initialValues, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const inputRef = useRef<any>(null);
	const [insertPropertyData, setInsertPropertyData] = useState<PropertyInput>(initialValues);
	const [propertyType, setPropertyType] = useState<PropertyType[]>(Object.values(PropertyType));
	const [propertyLocation, setPropertyLocation] = useState<PropertyLocation[]>(Object.values(PropertyLocation));
	const token = getJwtToken();
	const user = useReactiveVar(userVar);

	/** APOLLO REQUESTS **/
	const [createProperty] = useMutation(CREATE_PROPERTY);
	const [updateProperty] = useMutation(UPDATE_PROPERTY);

	const {
		loading: getPropertyLoading,
		data: getPropertyData,
		error: getPropertyError,
		refetch: getPropertyRefetch,
	} = useQuery(GET_PROPERTY, {
		fetchPolicy: 'network-only',
		variables: {
			input: router.query.propertyId,
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		setInsertPropertyData({
			...insertPropertyData,
			propertyTitle: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyTitle : '',
			propertyPrice: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyPrice : 0,
			propertyType: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyType : '',
			propertyLocation: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyLocation : '',
			propertyAddress: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyAddress : '',
			propertyBarter: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyBarter : false,
			propertyRent: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyRent : false,
			propertyRooms: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyRooms : 0,
			propertyBeds: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyBeds : 0,
			propertySquare: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertySquare : 0,
			propertyDesc: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyDesc : '',
			propertyImages: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyImages : [],
		});
	}, [getPropertyLoading, getPropertyData]);

	/** HANDLERS **/
	async function uploadImages() {
		try {
			const formData = new FormData();
			const selectedFiles = inputRef.current.files;

			if (selectedFiles.length == 0) return false;
			if (selectedFiles.length > 5) throw new Error('Cannot upload more than 5 images!');

			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImagesUploader($files: [Upload!]!, $target: String!) { 
						imagesUploader(files: $files, target: $target)
				  }`,
					variables: {
						files: [null, null, null, null, null],
						target: 'property',
					},
				}),
			);
			formData.append(
				'map',
				JSON.stringify({
					'0': ['variables.files.0'],
					'1': ['variables.files.1'],
					'2': ['variables.files.2'],
					'3': ['variables.files.3'],
					'4': ['variables.files.4'],
				}),
			);
			for (const key in selectedFiles) {
				if (/^\d+$/.test(key)) formData.append(`${key}`, selectedFiles[key]);
			}

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImages = response.data.data.imagesUploader;

			console.log('+responseImages: ', responseImages);
			setInsertPropertyData({ ...insertPropertyData, propertyImages: responseImages });
		} catch (err: any) {
			console.log('err: ', err.message);
			await sweetMixinErrorAlert(err.message);
		}
	}

	const doDisabledCheck = () => {
		if (
			insertPropertyData.propertyTitle === '' ||
			insertPropertyData.propertyPrice === 0 || // @ts-ignore
			insertPropertyData.propertyType === '' || // @ts-ignore
			insertPropertyData.propertyLocation === '' || // @ts-ignore
			insertPropertyData.propertyAddress === '' || // @ts-ignore
			insertPropertyData.propertyBarter === '' || // @ts-ignore
			insertPropertyData.propertyRent === '' ||
			insertPropertyData.propertyRooms === 0 ||
			insertPropertyData.propertyBeds === 0 ||
			insertPropertyData.propertySquare === 0 ||
			insertPropertyData.propertyDesc === '' ||
			insertPropertyData.propertyImages.length === 0
		) {
			return true;
		}
	};

	const insertPropertyHandler = useCallback(async () => {
		try {
			const result = await createProperty({
				variables: {
					input: insertPropertyData,
				},
			});

			await sweetMixinSuccessAlert('This property has been created successfully.');
			await router.push({
				pathname: '/mypage',
				query: {
					category: 'myProperties',
				},
			});
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	}, [insertPropertyData]);

	const updatePropertyHandler = useCallback(async () => {
		try {
			// @ts-ignore
			insertPropertyData._id = getPropertyData?.getProperty?._id;
			const result = await updateProperty({
				variables: {
					input: insertPropertyData,
				},
			});

			await sweetMixinSuccessAlert('This property has been updated successfully.');
			await router.push({
				pathname: '/mypage',
				query: {
					category: 'myProperties',
				},
			});
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	}, [insertPropertyData]);

	if (user?.memberType !== 'AGENT') {
		router.back();
	}

	console.log('+insertPropertyData', insertPropertyData);

	if (device === 'mobile') {
		return <div>ADD NEW PROPERTY MOBILE PAGE</div>;
	} else {
		return (
			<div id="add-property-page">
				<Stack className="main-title-box">
					<Typography className="main-title">Add New Property</Typography>
					<Typography className="sub-title">We are glad to see you again!</Typography>
				</Stack>

				<div>
					<Stack className="config">
						<Stack className="description-box">
							<Stack className="config-column">
								<Typography className="title">Title</Typography>
								<input
									type="text"
									className="description-input"
									placeholder={'Title'}
									value={insertPropertyData.propertyTitle}
									onChange={({ target: { value } }) =>
										setInsertPropertyData({ ...insertPropertyData, propertyTitle: value })
									}
								/>
							</Stack>

							<Stack className="config-row">
								<Stack className="price-year-after-price">
									<Typography className="title">Price</Typography>
									<input
										type="text"
										className="description-input"
										placeholder={'Price'}
										value={insertPropertyData.propertyPrice}
										onChange={({ target: { value } }) =>
											setInsertPropertyData({ ...insertPropertyData, propertyPrice: parseInt(value) })
										}
									/>
								</Stack>
								<Stack className="price-year-after-price">
									<Typography className="title">Select Type</Typography>
									<select
										className={'select-description'}
										defaultValue={insertPropertyData.propertyType || 'select'}
										value={insertPropertyData.propertyType || 'select'}
										onChange={({ target: { value } }) =>
											// @ts-ignore
											setInsertPropertyData({ ...insertPropertyData, propertyType: value })
										}
									>
										<>
											<option selected={true} disabled={true} value={'select'}>
												Select
											</option>
											{propertyType.map((type: any) => (
												<option value={`${type}`} key={type}>
													{type}
												</option>
											))}
										</>
									</select>
									<div className={'divider'}></div>
									<img src={'/img/icons/Vector.svg'} className={'arrow-down'} />
								</Stack>
							</Stack>

							<Stack className="config-row">
								<Stack className="price-year-after-price">
									<Typography className="title">Select Location</Typography>
									<select
										className={'select-description'}
										defaultValue={insertPropertyData.propertyLocation || 'select'}
										value={insertPropertyData.propertyLocation || 'select'}
										onChange={({ target: { value } }) =>
											// @ts-ignore
											setInsertPropertyData({ ...insertPropertyData, propertyLocation: value })
										}
									>
										<>
											<option selected={true} disabled={true} value={'select'}>
												Select
											</option>
											{propertyLocation.map((location: any) => (
												<option value={`${location}`} key={location}>
													{location}
												</option>
											))}
										</>
									</select>
									<div className={'divider'}></div>
									<img src={'/img/icons/Vector.svg'} className={'arrow-down'} />
								</Stack>
								<Stack className="price-year-after-price">
									<Typography className="title">Address</Typography>
									<input
										type="text"
										className="description-input"
										placeholder={'Address'}
										value={insertPropertyData.propertyAddress}
										onChange={({ target: { value } }) =>
											setInsertPropertyData({ ...insertPropertyData, propertyAddress: value })
										}
									/>
								</Stack>
							</Stack>

							<Stack className="config-row">
								<Stack className="price-year-after-price">
									<Typography className="title">Barter</Typography>
									<select
										className={'select-description'}
										value={insertPropertyData.propertyBarter ? 'yes' : 'no'}
										defaultValue={insertPropertyData.propertyBarter ? 'yes' : 'no'}
										onChange={({ target: { value } }) =>
											setInsertPropertyData({ ...insertPropertyData, propertyBarter: value === 'yes' })
										}
									>
										<option disabled={true} selected={true}>
											Select
										</option>
										<option value={'yes'}>Yes</option>
										<option value={'no'}>No</option>
									</select>
									<div className={'divider'}></div>
									<img src={'/img/icons/Vector.svg'} className={'arrow-down'} />
								</Stack>
								<Stack className="price-year-after-price">
									<Typography className="title">Rent</Typography>
									<select
										className={'select-description'}
										value={insertPropertyData.propertyRent ? 'yes' : 'no'}
										defaultValue={insertPropertyData.propertyRent ? 'yes' : 'no'}
										onChange={({ target: { value } }) =>
											setInsertPropertyData({ ...insertPropertyData, propertyRent: value === 'yes' })
										}
									>
										<option disabled={true} selected={true}>
											Select
										</option>
										<option value={'yes'}>Yes</option>
										<option value={'no'}>No</option>
									</select>
									<div className={'divider'}></div>
									<img src={'/img/icons/Vector.svg'} className={'arrow-down'} />
								</Stack>
							</Stack>

							<Stack className="config-row">
								<Stack className="price-year-after-price">
									<Typography className="title">Rooms</Typography>
									<select
										className={'select-description'}
										value={insertPropertyData.propertyRooms || 'select'}
										defaultValue={insertPropertyData.propertyRooms || 'select'}
										onChange={({ target: { value } }) =>
											setInsertPropertyData({ ...insertPropertyData, propertyRooms: parseInt(value) })
										}
									>
										<option disabled={true} selected={true} value={'select'}>
											Select
										</option>
										{[1, 2, 3, 4, 5].map((room: number) => (
											<option value={`${room}`}>{room}</option>
										))}
									</select>
									<div className={'divider'}></div>
									<img src={'/img/icons/Vector.svg'} className={'arrow-down'} />
								</Stack>
								<Stack className="price-year-after-price">
									<Typography className="title">Bed</Typography>
									<select
										className={'select-description'}
										value={insertPropertyData.propertyBeds || 'select'}
										defaultValue={insertPropertyData.propertyBeds || 'select'}
										onChange={({ target: { value } }) =>
											setInsertPropertyData({ ...insertPropertyData, propertyBeds: parseInt(value) })
										}
									>
										<option disabled={true} selected={true} value={'select'}>
											Select
										</option>
										{[1, 2, 3, 4, 5].map((bed: number) => (
											<option value={`${bed}`}>{bed}</option>
										))}
									</select>
									<div className={'divider'}></div>
									<img src={'/img/icons/Vector.svg'} className={'arrow-down'} />
								</Stack>
								<Stack className="price-year-after-price">
									<Typography className="title">Square</Typography>
									<select
										className={'select-description'}
										value={insertPropertyData.propertySquare || 'select'}
										defaultValue={insertPropertyData.propertySquare || 'select'}
										onChange={({ target: { value } }) =>
											setInsertPropertyData({ ...insertPropertyData, propertySquare: parseInt(value) })
										}
									>
										<option disabled={true} selected={true} value={'select'}>
											Select
										</option>
										{propertySquare.map((square: number) => {
											if (square !== 0) {
												return <option value={`${square}`}>{square}</option>;
											}
										})}
									</select>
									<div className={'divider'}></div>
									<img src={'/img/icons/Vector.svg'} className={'arrow-down'} />
								</Stack>
							</Stack>

							<Typography className="property-title">Property Description</Typography>
							<Stack className="config-column">
								<Typography className="title">Description</Typography>
								<textarea
									name=""
									id=""
									className="description-text"
									value={insertPropertyData.propertyDesc}
									onChange={({ target: { value } }) =>
										setInsertPropertyData({ ...insertPropertyData, propertyDesc: value })
									}
								></textarea>
							</Stack>
						</Stack>

						<Typography className="upload-title">Upload photos of your property</Typography>
						<Stack className="images-box">
							<Stack className="upload-box">
								<svg xmlns="http://www.w3.org/2000/svg" width="121" height="120" viewBox="0 0 121 120" fill="none">
									<g clipPath="url(#clip0_7037_5336)">
										<path
											d="M68.9453 52.0141H52.9703C52.4133 52.0681 51.8511 52.005 51.32 51.8289C50.7888 51.6528 50.3004 51.3675 49.886 50.9914C49.4716 50.6153 49.1405 50.1567 48.9139 49.645C48.6874 49.1333 48.5703 48.5799 48.5703 48.0203C48.5703 47.4607 48.6874 46.9073 48.9139 46.3956C49.1405 45.884 49.4716 45.4253 49.886 45.0492C50.3004 44.6731 50.7888 44.3878 51.32 44.2117C51.8511 44.0356 52.4133 43.9725 52.9703 44.0266H68.9828C69.5397 43.9725 70.1019 44.0356 70.633 44.2117C71.1642 44.3878 71.6527 44.6731 72.067 45.0492C72.4814 45.4253 72.8125 45.884 73.0391 46.3956C73.2657 46.9073 73.3827 47.4607 73.3827 48.0203C73.3827 48.5799 73.2657 49.1333 73.0391 49.645C72.8125 50.1567 72.4814 50.6153 72.067 50.9914C71.6527 51.3675 71.1642 51.6528 70.633 51.8289C70.1019 52.005 69.5397 52.0681 68.9828 52.0141H68.9453Z"
											fill="#DDDDDD"
										/>
										<path
											d="M72.4361 65.0288L63.6236 57.0413C62.8704 56.3994 61.9132 56.0469 60.9236 56.0469C59.934 56.0469 58.9768 56.3994 58.2236 57.0413L49.4111 65.0288C48.6807 65.7585 48.2597 66.7415 48.2355 67.7736C48.2113 68.8057 48.5859 69.8074 49.2813 70.5704C49.9767 71.3335 50.9394 71.7991 51.9693 71.8705C52.9992 71.9419 54.017 71.6136 54.8111 70.9538L56.9111 69.0413V88.0163C57.0074 89.0088 57.4697 89.9298 58.208 90.6C58.9464 91.2701 59.9077 91.6414 60.9048 91.6414C61.9019 91.6414 62.8633 91.2701 63.6016 90.6C64.34 89.9298 64.8023 89.0088 64.8986 88.0163V69.0413L66.9986 70.9538C67.3823 71.3372 67.8398 71.6387 68.3434 71.8403C68.8469 72.0418 69.3861 72.1392 69.9284 72.1265C70.4706 72.1138 71.0046 71.9913 71.4982 71.7664C71.9918 71.5415 72.4346 71.2188 72.8 70.8179C73.1653 70.417 73.4456 69.9463 73.6239 69.434C73.8022 68.9217 73.8748 68.3786 73.8373 67.8375C73.7997 67.2965 73.6529 66.7686 73.4056 66.2858C73.1584 65.8031 72.8158 65.3755 72.3986 65.0288H72.4361Z"
											fill="#DDDDDD"
										/>
										<path
											d="M100.975 120.003C100.418 120.057 99.8558 119.994 99.3247 119.818C98.7935 119.642 98.3051 119.357 97.8907 118.98C97.4763 118.604 97.1452 118.146 96.9186 117.634C96.6921 117.122 96.575 116.569 96.575 116.009C96.575 115.45 96.6921 114.896 96.9186 114.385C97.1452 113.873 97.4763 113.414 97.8907 113.038C98.3051 112.662 98.7935 112.377 99.3247 112.201C99.8558 112.025 100.418 111.962 100.975 112.016C104.158 112.016 107.21 110.751 109.46 108.501C111.711 106.25 112.975 103.198 112.975 100.016V19.9906C112.975 16.808 111.711 13.7558 109.46 11.5053C107.21 9.25491 104.158 7.99063 100.975 7.99063H36.9624C36.4055 8.04466 35.8433 7.98159 35.3122 7.80547C34.781 7.62935 34.2926 7.34408 33.8782 6.96797C33.4638 6.59186 33.1327 6.13324 32.9061 5.62156C32.6796 5.10989 32.5625 4.55648 32.5625 3.99688C32.5625 3.43728 32.6796 2.88386 32.9061 2.37219C33.1327 1.86051 33.4638 1.40189 33.8782 1.02578C34.2926 0.649674 34.781 0.364397 35.3122 0.188277C35.8433 0.0121578 36.4055 -0.05091 36.9624 0.00312538H100.975C106.273 0.0130374 111.351 2.12204 115.097 5.86828C118.844 9.61451 120.953 14.6927 120.962 19.9906V100.016C120.953 105.314 118.844 110.392 115.097 114.138C111.351 117.884 106.273 119.993 100.975 120.003Z"
											fill="#DDDDDD"
										/>
										<path
											d="M84.9609 120.003H20.9484C15.6505 119.993 10.5723 117.884 6.82609 114.138C3.07985 110.392 0.97085 105.314 0.960938 100.016L0.960938 19.9906C0.97085 14.6927 3.07985 9.61451 6.82609 5.86828C10.5723 2.12204 15.6505 0.0130374 20.9484 0.00312538C21.5054 -0.05091 22.0676 0.0121578 22.5987 0.188277C23.1299 0.364397 23.6183 0.649674 24.0327 1.02578C24.4471 1.40189 24.7782 1.86051 25.0047 2.37219C25.2313 2.88386 25.3484 3.43728 25.3484 3.99688C25.3484 4.55648 25.2313 5.10989 25.0047 5.62156C24.7782 6.13324 24.4471 6.59186 24.0327 6.96797C23.6183 7.34408 23.1299 7.62935 22.5987 7.80547C22.0676 7.98159 21.5054 8.04466 20.9484 7.99063C17.7658 7.99063 14.7136 9.25491 12.4632 11.5053C10.2127 13.7558 8.94844 16.808 8.94844 19.9906V100.016C8.94844 103.198 10.2127 106.25 12.4632 108.501C14.7136 110.751 17.7658 112.016 20.9484 112.016H84.9609C85.5179 111.962 86.08 112.025 86.6112 112.201C87.1424 112.377 87.6308 112.662 88.0452 113.038C88.4595 113.414 88.7907 113.873 89.0172 114.385C89.2438 114.896 89.3609 115.45 89.3609 116.009C89.3609 116.569 89.2438 117.122 89.0172 117.634C88.7907 118.146 88.4595 118.604 88.0452 118.98C87.6308 119.357 87.1424 119.642 86.6112 119.818C86.08 119.994 85.5179 120.057 84.9609 120.003Z"
											fill="#DDDDDD"
										/>
										<path
											d="M28.9704 24.0031H20.9454C19.9529 23.9068 19.0319 23.4445 18.3617 22.7062C17.6916 21.9679 17.3203 21.0065 17.3203 20.0094C17.3203 19.0123 17.6916 18.0509 18.3617 17.3126C19.0319 16.5743 19.9529 16.1119 20.9454 16.0156H28.9704C29.9628 16.1119 30.8839 16.5743 31.554 17.3126C32.2242 18.0509 32.5954 19.0123 32.5954 20.0094C32.5954 21.0065 32.2242 21.9679 31.554 22.7062C30.8839 23.4445 29.9628 23.9068 28.9704 24.0031Z"
											fill="#DDDDDD"
										/>
										<path
											d="M76.9736 24.0016C76.4485 24.0065 75.9275 23.9074 75.4409 23.7098C74.9543 23.5123 74.5117 23.2203 74.1386 22.8507C73.7655 22.481 73.4693 22.0412 73.2672 21.5564C73.0651 21.0717 72.9611 20.5517 72.9611 20.0266C72.9537 19.2314 73.1827 18.452 73.619 17.7872C74.0554 17.1224 74.6794 16.6023 75.4119 16.2929C76.1444 15.9834 76.9524 15.8986 77.7332 16.0491C78.514 16.1997 79.2324 16.5789 79.7973 17.1385C80.3623 17.6981 80.7482 18.413 80.906 19.1924C81.0639 19.9717 80.9867 20.7804 80.6841 21.5158C80.3816 22.2512 79.8673 22.8801 79.2067 23.3226C78.546 23.7652 77.7688 24.0015 76.9736 24.0016Z"
											fill="#DDDDDD"
										/>
										<path
											d="M88.9736 24.0016C88.4485 24.0065 87.9275 23.9074 87.4409 23.7098C86.9543 23.5123 86.5117 23.2203 86.1386 22.8507C85.7655 22.481 85.4693 22.0412 85.2672 21.5564C85.0651 21.0717 84.9611 20.5517 84.9611 20.0266C84.9537 19.2314 85.1827 18.452 85.619 17.7872C86.0554 17.1224 86.6794 16.6023 87.4119 16.2929C88.1444 15.9834 88.9524 15.8986 89.7332 16.0491C90.514 16.1997 91.2324 16.5789 91.7974 17.1385C92.3623 17.6981 92.7482 18.413 92.9061 19.1924C93.0639 19.9717 92.9867 20.7804 92.6841 21.5158C92.3816 22.2512 91.8673 22.8801 91.2067 23.3226C90.5461 23.7652 89.7688 24.0015 88.9736 24.0016Z"
											fill="#DDDDDD"
										/>
										<path
											d="M100.974 24.0016C100.448 24.0065 99.9275 23.9074 99.4409 23.7098C98.9543 23.5123 98.5117 23.2203 98.1386 22.8507C97.7655 22.481 97.4693 22.0412 97.2672 21.5564C97.0651 21.0717 96.9611 20.5517 96.9611 20.0266C96.9537 19.2314 97.1827 18.452 97.619 17.7872C98.0554 17.1224 98.6794 16.6023 99.4119 16.2929C100.144 15.9834 100.952 15.8986 101.733 16.0491C102.514 16.1997 103.232 16.5789 103.797 17.1385C104.362 17.6981 104.748 18.413 104.906 19.1924C105.064 19.9717 104.987 20.7804 104.684 21.5158C104.382 22.2512 103.867 22.8801 103.207 23.3226C102.546 23.7652 101.769 24.0015 100.974 24.0016Z"
											fill="#DDDDDD"
										/>
									</g>
									<defs>
										<clipPath id="clip0_7037_5336">
											<rect width="120" height="120" fill="white" transform="translate(0.960938)" />
										</clipPath>
									</defs>
								</svg>
								<Stack className="text-box">
									<Typography className="drag-title">Drag and drop images here</Typography>
									<Typography className="format-title">Photos must be JPEG or PNG format and least 2048x768</Typography>
								</Stack>
								<Button
									className="browse-button"
									onClick={() => {
										inputRef.current.click();
									}}
								>
									<Typography className="browse-button-text">Browse Files</Typography>
									<input
										ref={inputRef}
										type="file"
										hidden={true}
										onChange={uploadImages}
										multiple={true}
										accept="image/jpg, image/jpeg, image/png"
									/>
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
										<g clipPath="url(#clip0_7309_3249)">
											<path
												d="M15.5556 0H5.7778C5.53214 0 5.33334 0.198792 5.33334 0.444458C5.33334 0.690125 5.53214 0.888917 5.7778 0.888917H14.4827L0.130219 15.2413C-0.0434062 15.415 -0.0434062 15.6962 0.130219 15.8698C0.21701 15.9566 0.33076 16 0.444469 16C0.558177 16 0.671885 15.9566 0.758719 15.8698L15.1111 1.51737V10.2222C15.1111 10.4679 15.3099 10.6667 15.5556 10.6667C15.8013 10.6667 16.0001 10.4679 16.0001 10.2222V0.444458C16 0.198792 15.8012 0 15.5556 0Z"
												fill="#181A20"
											/>
										</g>
										<defs>
											<clipPath id="clip0_7309_3249">
												<rect width="16" height="16" fill="white" />
											</clipPath>
										</defs>
									</svg>
								</Button>
							</Stack>
							<Stack className="gallery-box">
								{insertPropertyData?.propertyImages.map((image: string) => {
									const imagePath: string = `${REACT_APP_API_URL}/${image}`;
									return (
										<Stack className="image-box">
											<img src={imagePath} alt="" />
										</Stack>
									);
								})}
							</Stack>
						</Stack>

						<Stack className="buttons-row">
							{router.query.propertyId ? (
								<Button className="next-button" disabled={doDisabledCheck()} onClick={updatePropertyHandler}>
									<Typography className="next-button-text">Save</Typography>
								</Button>
							) : (
								<Button className="next-button" disabled={doDisabledCheck()} onClick={insertPropertyHandler}>
									<Typography className="next-button-text">Save</Typography>
								</Button>
							)}
						</Stack>
					</Stack>
				</div>
			</div>
		);
	}
};

AddProperty.defaultProps = {
	initialValues: {
		propertyTitle: '',
		propertyPrice: 0,
		propertyType: '',
		propertyLocation: '',
		propertyAddress: '',
		propertyBarter: false,
		propertyRent: false,
		propertyRooms: 0,
		propertyBeds: 0,
		propertySquare: 0,
		propertyDesc: '',
		propertyImages: [],
	},
};

export default AddProperty;
