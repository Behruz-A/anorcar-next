import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import {
	CameraAltOutlined,
	FileUploadOutlined,
	BadgeOutlined,
	PhoneOutlined,
	LocationOnOutlined,
	SaveOutlined,
	ManageAccountsOutlined,
	CheckCircleOutline,
} from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import axios from 'axios';
import { imageUrl, REACT_APP_API_GRAPHQL_URL } from '../../config';
import { getJwtToken, updateStorage, updateUserInfo } from '../../auth';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { MemberUpdate } from '../../types/member/member.update';
import { Member } from '../../types/member/member';
import { UPDATE_MEMBER } from '../../../apollo/user/mutation';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';

type ProfileDraft = Required<
	Pick<MemberUpdate, '_id' | 'memberNick' | 'memberPhone' | 'memberAddress' | 'memberImage'>
>;
type UploadResponse = { data?: { imageUploader?: string }; errors?: { message: string }[] };
const fallbackPhoto = '/img/profile/defaultUser.svg';

const MyProfile = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const initialValues = useMemo<ProfileDraft>(
		() => ({
			_id: user._id,
			memberNick: user.memberNick,
			memberPhone: user.memberPhone,
			memberAddress: user.memberAddress || '',
			memberImage: user.memberImage === fallbackPhoto ? '' : user.memberImage || '',
		}),
		[user._id, user.memberNick, user.memberPhone, user.memberAddress, user.memberImage],
	);
	const [updateData, setUpdateData] = useState(initialValues);
	const [uploading, setUploading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [touched, setTouched] = useState({ username: false, phone: false });
	const fileInput = useRef<HTMLInputElement>(null);
	const busyRef = useRef(false);
	const mounted = useRef(true);
	const [updateMember] = useMutation<{ updateMember: Member }>(UPDATE_MEMBER);
	useEffect(() => {
		setUpdateData(initialValues);
		setError('');
		setTouched({ username: false, phone: false });
	}, [initialValues]);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);
	const busy = uploading || saving;
	const dirty = Object.keys(initialValues).some(
		(key) => updateData[key as keyof ProfileDraft] !== initialValues[key as keyof ProfileDraft],
	);
	const validUsername = updateData.memberNick.trim().length >= 3 && updateData.memberNick.trim().length <= 12;
	const validPhone = !!updateData.memberPhone.trim();
	const valid = validUsername && validPhone;

	const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const image = event.target.files?.[0];
		event.target.value = '';
		if (!image || busyRef.current) return;
		if (!['image/jpeg', 'image/png'].includes(image.type) || image.size > 5 * 1024 * 1024) {
			setError(t('Choose a JPG, JPEG or PNG image up to 5 MB.'));
			return;
		}
		const memberId = user._id;
		busyRef.current = true;
		setUploading(true);
		setError('');
		try {
			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) { imageUploader(file: $file, target: $target) }`,
					variables: { file: null, target: 'member' },
				}),
			);
			formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
			formData.append('0', image);
			const response = await axios.post<UploadResponse>(REACT_APP_API_GRAPHQL_URL, formData, {
				headers: { 'apollo-require-preflight': 'true', Authorization: `Bearer ${getJwtToken()}` },
			});
			const uploadedImage = response.data.data?.imageUploader;
			if (response.data.errors?.length || !uploadedImage)
				throw new Error(response.data.errors?.[0]?.message || t('Could not upload your photo. Please try again.'));
			if (mounted.current && userVar()._id === memberId)
				setUpdateData((draft) => ({ ...draft, memberImage: uploadedImage }));
		} catch (uploadError) {
			if (mounted.current && userVar()._id === memberId) {
				setError(t('Could not upload your photo. Please try again.'));
				void sweetErrorHandling(uploadError);
			}
		} finally {
			busyRef.current = false;
			if (mounted.current) setUploading(false);
		}
	};
	const updateProfileHandler = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!valid || !dirty || busyRef.current || !user._id) return;
		const memberId = user._id;
		busyRef.current = true;
		setSaving(true);
		setError('');
		try {
			const result = await updateMember({
				variables: {
					input: {
						...updateData,
						_id: memberId,
						memberNick: updateData.memberNick.trim(),
						memberPhone: updateData.memberPhone.trim(),
					},
				},
			});
			if (!mounted.current || userVar()._id !== memberId) return;
			const jwtToken = result.data?.updateMember?.accessToken;
			if (!jwtToken) throw new Error(t('Could not save your changes. Please try again.'));
			updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
			await sweetMixinSuccessAlert(t('Profile updated successfully.'));
		} catch (saveError) {
			if (mounted.current && userVar()._id === memberId) {
				setError(t('Could not save your changes. Please try again.'));
				void sweetErrorHandling(saveError);
			}
		} finally {
			busyRef.current = false;
			if (mounted.current) setSaving(false);
		}
	};
	return (
		<div id="my-profile-page" className="account-profile-card">
			<header className="account-profile-heading">
				<span className="account-section-icon" aria-hidden="true">
					<ManageAccountsOutlined />
				</span>
				<div>
					<Typography component="h2">{t('My Profile')}</Typography>
					<Typography>{t('Manage your personal information.')}</Typography>
				</div>
			</header>
			<form onSubmit={updateProfileHandler} aria-busy={busy}>
				<fieldset disabled={busy}>
					<legend className="account-sr-only">{t('My Profile')}</legend>
					<section className="account-photo-section" aria-labelledby="profile-photo-label">
						<Typography id="profile-photo-label" className="account-field-label">
							{t('Profile Photo')}
						</Typography>
						<Stack className="account-photo-row">
							<div className="account-photo-preview">
								<img
									src={imageUrl(updateData.memberImage || fallbackPhoto)}
									alt={t('Profile Photo')}
									onError={(event) => {
										event.currentTarget.onerror = null;
										event.currentTarget.src = fallbackPhoto;
									}}
								/>
								<button
									type="button"
									className="account-camera-button"
									onClick={() => fileInput.current?.click()}
									aria-label={t('Change Photo')}
								>
									<CameraAltOutlined />
								</button>
							</div>
							<Stack className="account-photo-controls">
								<Stack className="account-photo-actions">
									<input
										ref={fileInput}
										type="file"
										hidden
										onChange={uploadImage}
										accept="image/jpeg,image/png"
										aria-label={t('Change Photo')}
									/>
									<Button
										variant="outlined"
										startIcon={<FileUploadOutlined />}
										onClick={() => fileInput.current?.click()}
										disabled={busy}
									>
										{t(uploading ? 'Uploading...' : 'Change Photo')}
									</Button>
									<Button
										className="account-remove-photo"
										onClick={() => setUpdateData((draft) => ({ ...draft, memberImage: '' }))}
										disabled={busy || !updateData.memberImage}
									>
										{t('Remove Photo')}
									</Button>
								</Stack>
								<Typography className="account-photo-hint">
									{t('Supported formats: JPG, JPEG, PNG. Max file size: 5 MB. A square photo is recommended.')}
								</Typography>
							</Stack>
						</Stack>
					</section>
					<div className="account-profile-fields">
						<div className="account-profile-field">
							<label htmlFor="profile-username">{t('Username')}</label>
							<div className="account-input-wrap">
								<BadgeOutlined />
								<input
									id="profile-username"
									name="username"
									autoComplete="username"
									required
									minLength={3}
									maxLength={12}
									aria-invalid={touched.username && !validUsername}
									aria-describedby="profile-username-help"
									onBlur={() => setTouched((value) => ({ ...value, username: true }))}
									value={updateData.memberNick}
									onChange={(event) => setUpdateData({ ...updateData, memberNick: event.target.value })}
								/>
							</div>
							<p
								id="profile-username-help"
								className={`account-field-help${touched.username && !validUsername ? ' is-error' : ''}`}
							>
								{t('Username must contain 3–12 characters.')}
							</p>
						</div>
						<div className="account-profile-field">
							<label htmlFor="profile-phone">{t('Phone Number')}</label>
							<div className="account-input-wrap">
								<PhoneOutlined />
								<input
									id="profile-phone"
									name="phone"
									type="tel"
									autoComplete="tel"
									required
									aria-invalid={touched.phone && !validPhone}
									aria-describedby={touched.phone && !validPhone ? 'profile-phone-help' : undefined}
									onBlur={() => setTouched((value) => ({ ...value, phone: true }))}
									value={updateData.memberPhone}
									onChange={(event) => setUpdateData({ ...updateData, memberPhone: event.target.value })}
								/>
							</div>
							{touched.phone && !validPhone && (
								<p id="profile-phone-help" className="account-field-help is-error">
									{t('Enter your phone number.')}
								</p>
							)}
						</div>
						<div className="account-profile-field account-address-field">
							<label htmlFor="profile-address">
								{t('Address')}
								<span className="account-optional">{t('Optional')}</span>
							</label>
							<div className="account-input-wrap">
								<LocationOnOutlined />
								<input
									id="profile-address"
									name="address"
									autoComplete="street-address"
									placeholder={t('Your address')}
									value={updateData.memberAddress}
									onChange={(event) => setUpdateData({ ...updateData, memberAddress: event.target.value })}
								/>
							</div>
						</div>
					</div>
				</fieldset>
				{error && (
					<p role="alert" className="account-profile-error">
						{error}
					</p>
				)}
				<footer className="account-profile-actions">
					<span className={`account-save-status${dirty ? ' is-dirty' : ''}`} role="status" aria-live="polite">
						{!dirty && !busy && <CheckCircleOutline aria-hidden="true" />}
						{t(
							uploading
								? 'Uploading...'
								: saving
								? 'Saving...'
								: !valid
								? 'Check the required fields.'
								: dirty
								? 'You have unsaved changes.'
								: 'No changes to save.',
						)}
					</span>
					<div className="account-save-buttons">
						<Button
							variant="outlined"
							disabled={busy || !dirty}
							onClick={() => {
								setUpdateData(initialValues);
								setError('');
								setTouched({ username: false, phone: false });
							}}
						>
							{t('Cancel')}
						</Button>
						<Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={busy || !valid || !dirty}>
							{t(saving ? 'Saving...' : 'Save Changes')}
						</Button>
					</div>
				</footer>
			</form>
		</div>
	);
};
export default MyProfile;
