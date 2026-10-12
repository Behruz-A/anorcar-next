import React, { FormEvent, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Alert, Button, TextField, MenuItem } from '@mui/material';
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded';
import EastRounded from '@mui/icons-material/EastRounded';

const subjects = ['Buying a car', 'Selling a car', 'My account', 'Technical support', 'Community'];
const mapHref =
	'https://www.google.com/maps/search/?api=1&query=Seoul%20City%20Hall%2C%20110%20Sejong-daero%2C%20Seoul';
const Inquiry = () => {
	const { t } = useTranslation('common');
	const [status, setStatus] = useState(false);
	const [error, setError] = useState(false);
	const submitHandler = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		if (!form.reportValidity()) return;
		const fields = new FormData(form);
		const name = String(fields.get('name') ?? '').trim();
		const email = String(fields.get('email') ?? '').trim();
		const subject = String(fields.get('subject') ?? '');
		const message = String(fields.get('message') ?? '').trim();
		if (!name || !message || !subjects.includes(subject)) {
			setError(true);
			return;
		}
		setError(false);
		const body = name + ' <' + email + '>\n\n' + message;
		window.open(
			'mailto:info@anorcar.com?subject=' +
				encodeURIComponent('ANORCAR: ' + t(subject)) +
				'&body=' +
				encodeURIComponent(body),
			'_self',
		);
		setStatus(true);
	};
	return (
		<section className="cs-inquiry" id="cs-contact" aria-labelledby="cs-contact-heading">
			<div className="cs-contact-grid">
				<div className="cs-contact-info">
					<h2 id="cs-contact-heading">{t('Get in touch')}</h2>
					<p>{t("Have a question? We'd love to hear from you.")}</p>
					<div className="cs-contact-detail">
						<span>
							<MailOutlineRounded />
						</span>
						<div>
							<h3>{t('Email support')}</h3>
							<a href="mailto:info@anorcar.com">info@anorcar.com</a>
						</div>
					</div>
					<div className="cs-contact-detail">
						<span>
							<LocationOnOutlined />
						</span>
						<div>
							<h3>{t('Explore Seoul')}</h3>
							<p>{t('Seoul City Hall')}</p>
						</div>
					</div>
					<div className="cs-contact-detail">
						<span>
							<HelpOutlineRounded />
						</span>
						<div>
							<h3>{t('Before you write')}</h3>
							<p>{t('Include the page address and a short description.')}</p>
						</div>
					</div>
				</div>
				<form
					className="cs-message-form"
					onSubmit={submitHandler}
					onChange={() => {
						setStatus(false);
						setError(false);
					}}
				>
					<h3>{t('Send us a message')}</h3>
					<div className="cs-form-row">
						<TextField
							name="name"
							label={t('Your name')}
							autoComplete="name"
							required
							size="small"
							inputProps={{ maxLength: 80, pattern: '.*\\S.*' }}
						/>
						<TextField
							name="email"
							label={t('Your email')}
							type="email"
							autoComplete="email"
							required
							size="small"
							inputProps={{ maxLength: 120 }}
						/>
					</div>
					<TextField
						name="subject"
						label={t('Subject')}
						select
						defaultValue=""
						required
						size="small"
						SelectProps={{
							MenuProps: {
								PaperProps: {
									sx: {
										'& .MuiMenuItem-root.Mui-selected': { backgroundColor: '#F3F4F6' },
										'& .MuiMenuItem-root:hover, & .MuiMenuItem-root.Mui-selected:hover': { backgroundColor: '#E5E7EB' },
										'& .MuiMenuItem-root.Mui-focusVisible': {
											outline: '2px solid #171A20',
											outlineOffset: '-2px',
											backgroundColor: '#F3F4F6',
										},
									},
								},
							},
						}}
					>
						{subjects.map((subject) => (
							<MenuItem key={subject} value={subject}>
								{t(subject)}
							</MenuItem>
						))}
					</TextField>
					<TextField
						name="message"
						label={t('How can we help?')}
						multiline
						minRows={3}
						required
						size="small"
						inputProps={{ maxLength: 1500 }}
					/>
					<Button type="submit" className="cs-send-button">
						{t('Open email draft')}
						<EastRounded fontSize="small" />
					</Button>
					<p className="cs-form-note">{t('Review and send the draft in your email app.')}</p>
					{error && <Alert severity="error">{t('Choose a subject and write your message.')}</Alert>}
					{status && (
						<Alert severity="info">
							{t('Your email app can open the draft. If it does not, email info@anorcar.com directly.')}
						</Alert>
					)}
				</form>
			</div>
			<div className="cs-location">
				<div className="cs-location-info">
					<h2>{t('Explore Seoul')}</h2>
					<p>{t('A central Seoul landmark shown on the map.')}</p>
					<h3>{t('Seoul City Hall')}</h3>
					<p>110 Sejong-daero, Jung-gu, Seoul</p>
					<a href={mapHref} target="_blank" rel="noopener noreferrer" className="cs-answer-link">
						{t('Open map')}
						<EastRounded fontSize="small" />
					</a>
					<span className="cs-location-note">{t('Reference location, not an ANORCAR office.')}</span>
				</div>
				<div className="cs-map">
					<iframe
						title={t('Map of Seoul City Hall')}
						src="https://maps.google.com/maps?q=Seoul%20City%20Hall%2C%20110%20Sejong-daero%2C%20Seoul&z=14&output=embed"
						referrerPolicy="strict-origin-when-cross-origin"
					/>
					<a href={mapHref} target="_blank" rel="noopener noreferrer" className="cs-map-pin">
						<LocationOnOutlined />
						<span>
							<strong>{t('Seoul City Hall')}</strong>
							<small>{t('Explore Seoul')}</small>
						</span>
						<EastRounded fontSize="small" />
					</a>
				</div>
			</div>
		</section>
	);
};
export default Inquiry;
