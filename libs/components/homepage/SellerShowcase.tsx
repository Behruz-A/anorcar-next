import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard, Navigation } from 'swiper/modules';
import { useTranslation } from 'next-i18next';
import { CarFuelType } from '../../enums/car.enum';
import { Direction } from '../../enums/common.enum';
import { CarsInquiry } from '../../types/car/car.input';

const electricInput: CarsInquiry = {
	page: 1,
	limit: 9,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: { fuelTypes: [CarFuelType.ELECTRIC] },
};
const electricHref = { pathname: '/car', query: { input: JSON.stringify(electricInput) } };
const guides = [
	{
		title: 'Explore Electric Cars',
		image: 'explore.webp',
		alt: 'An electric Hyundai at a charging station',
		href: electricHref,
	},
	{
		title: 'EV Charging Guide',
		image: 'charging.webp',
		alt: 'A driver connecting an electric car charging cable',
	},
	{
		title: 'Compare Electric Cars',
		image: 'compare-ev6.jpg',
		alt: 'A Kia EV6 electric car',
		href: '/car/compare',
	},
];
const chargingTopics = [
	{
		title: 'AC and DC charging',
		text: 'AC charging is commonly used at home and destination chargers. DC fast charging can be useful on longer journeys. Charging speed depends on the vehicle, charger, battery level, and temperature.',
	},
	{
		title: 'Check compatibility',
		text: 'Check the vehicle manual and charging station details for compatible connectors and charging limits before you plug in.',
	},
	{
		title: 'Plan your charging stops',
		text: 'Check nearby stations, availability, and the charging operator’s current tariff. Fees and payment methods vary by operator, so review them before starting a session.',
	},
];

export default function SellerShowcase() {
	const { t } = useTranslation('common');
	const [guideOpen, setGuideOpen] = useState(false);
	return (
		<section className="seller-showcase electric-discovery" aria-labelledby="electric-discovery-heading">
			<div className="seller-showcase-container">
				<div className="electric-header">
					<span className="electric-heading-icon" aria-hidden="true">
						<BoltRoundedIcon />
					</span>
					<div className="electric-heading-copy">
						<h2 id="electric-discovery-heading">{t('Discover Electric Cars at ANORCAR')}</h2>
						<p>
							{t('Explore electric vehicles, compare models, and get helpful information to make the right choice.')}
						</p>
					</div>
				</div>
				<div className="electric-carousel">
					<IconButton className="electric-prev" aria-label={t('Previous electric guides')}>
						<ArrowBackIosNewIcon />
					</IconButton>
					<Swiper
						className="electric-swiper"
						slidesPerView={1}
						spaceBetween={20}
						breakpoints={{ 700: { slidesPerView: 2, spaceBetween: 20 }, 1201: { slidesPerView: 3, spaceBetween: 24 } }}
						modules={[Navigation, Keyboard, A11y]}
						keyboard={{ enabled: true, onlyInViewport: true }}
						watchOverflow
						navigation={{ prevEl: '.electric-prev', nextEl: '.electric-next' }}
						a11y={{ prevSlideMessage: t('Previous electric guides'), nextSlideMessage: t('Next electric guides') }}
					>
						{guides.map(({ title, image, alt, href }) => {
							const content = (
								<>
									<div className="electric-card-image">
										<Image
											src={`/img/electric-guides/${image}`}
											alt={t(alt)}
											fill
											sizes="(max-width: 699px) 90vw, (max-width: 1200px) 45vw, 550px"
										/>
									</div>
									<div className="electric-card-copy">
										<h3>{t(title)}</h3>
									</div>
								</>
							);
							return (
								<SwiperSlide key={title} className="electric-slide">
									{href ? (
										<Link className="electric-card" href={href}>
											{content}
										</Link>
									) : (
										<button type="button" className="electric-card" onClick={() => setGuideOpen(true)}>
											{content}
										</button>
									)}
								</SwiperSlide>
							);
						})}
					</Swiper>
					<IconButton className="electric-next" aria-label={t('Next electric guides')}>
						<ArrowForwardIosIcon />
					</IconButton>
				</div>
				<div className="electric-footer">
					<Button component={Link} href="/car/compare">
						{t('Compare Electric Cars')}
					</Button>
				</div>
			</div>
			<Dialog
				open={guideOpen}
				onClose={() => setGuideOpen(false)}
				maxWidth="sm"
				fullWidth
				aria-labelledby="ev-charging-guide-title"
				PaperProps={{ className: 'electric-guide-dialog' }}
			>
				<DialogTitle id="ev-charging-guide-title">
					{t('EV Charging Guide')}
					<IconButton aria-label={t('Close')} onClick={() => setGuideOpen(false)}>
						<CloseRoundedIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					{chargingTopics.map(({ title, text }) => (
						<section key={title}>
							<h3>{t(title)}</h3>
							<p>{t(text)}</p>
						</section>
					))}
				</DialogContent>
			</Dialog>
		</section>
	);
}
