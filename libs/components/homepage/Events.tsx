import React, { useId } from 'react';
import Image from 'next/image';
import { Stack, IconButton } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard, Navigation, Pagination } from 'swiper';
import type { Swiper as SwiperInstance } from 'swiper';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';

interface EventData {
	eventTitle: string;
	city: string;
	imageSrc: string;
	createdAt: string;
	description: string;
}
// Illustrative concepts, not confirmed events. No Event API is currently available.
const eventsData: EventData[] = [
	{
		eventTitle: 'Auto Tuning Show',
		description: 'Custom cars and fresh ideas from fellow enthusiasts.',
		city: 'Incheon',
		imageSrc: '/img/events/anorcar-meetup.png',
		createdAt: '2026-10-06T09:00:00.000Z',
	},
	{
		eventTitle: 'Seoul Auto Show',
		description: 'Discover new models and the latest automotive ideas.',
		city: 'Seoul',
		imageSrc: '/img/events/anorcar-show.png',
		createdAt: '2026-10-05T09:00:00.000Z',
	},
	{
		eventTitle: 'Speed Festival',
		description: 'Performance cars and a shared passion for the track.',
		city: 'Daegu',
		imageSrc: '/img/events/anorcar-track.png',
		createdAt: '2026-10-04T09:00:00.000Z',
	},
	{
		eventTitle: 'Busan Motor Festival',
		description: 'Cars, community, and an evening by the waterfront.',
		city: 'Busan',
		imageSrc: '/img/events/anorcar-festival.png',
		createdAt: '2026-10-03T09:00:00.000Z',
	},
	{
		eventTitle: 'Jeju EV Expo',
		description: 'Explore electric cars and the future of driving.',
		city: 'Jeju',
		imageSrc: '/img/events/anorcar-ev.png',
		createdAt: '2026-10-02T09:00:00.000Z',
	},
	{
		eventTitle: 'Community Drive Day',
		description: 'Scenic routes and good company for your next drive.',
		city: 'Gyeongju',
		imageSrc: '/img/car/home-hero.png',
		createdAt: '2026-10-01T09:00:00.000Z',
	},
];
const recentEvents = [...eventsData].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 6);

const updateEventCaptions = (swiper: SwiperInstance) => {
	if (swiper.destroyed) return;
	swiper.slides.forEach((slide) => {
		if (!(slide instanceof HTMLElement)) return;
		const clippedWidth = Math.max(0, -slide.getBoundingClientRect().left);
		slide.style.setProperty('--event-caption-shift', `${clippedWidth}px`);
	});
};

const EventCard = ({ event }: { event: EventData }) => {
	const { t } = useTranslation('common');
	const descriptionId = useId();
	return (
		<Stack
			component="article"
			className="event-card"
			tabIndex={0}
			aria-label={t(event.eventTitle)}
			aria-describedby={descriptionId}
		>
			<div className="event-image">
				<Image
					src={event.imageSrc}
					alt={t(event.eventTitle)}
					fill
					sizes="(max-width: 600px) 82vw, (max-width: 1000px) 42vw, 22vw"
				/>
			</div>
			<div className="event-copy">
				<p className="event-city">{t(event.city)}</p>
				<h3>{t(event.eventTitle)}</h3>
			</div>
			<p className="event-more" id={descriptionId}>
				{t(event.description)}
			</p>
		</Stack>
	);
};
const Events = () => {
	const { t } = useTranslation('common');
	return (
		<Stack component="section" className="events anorcar-events" aria-labelledby="home-events-title">
			<div className="events-heading">
				<span className="events-eyebrow">{t('Events')}</span>
				<h2 id="home-events-title">{t('Events')}</h2>
				<p>{t('Discover the next gathering of our car community.')}</p>
			</div>
			<Swiper
				className="events-swiper"
				slidesPerView="auto"
				centeredSlides
				initialSlide={2}
				spaceBetween={22}
				onSetTranslate={(swiper) => requestAnimationFrame(() => updateEventCaptions(swiper))}
				onTransitionEnd={updateEventCaptions}
				onResize={updateEventCaptions}
				modules={[Keyboard, A11y, Navigation, Pagination]}
				keyboard={{ enabled: true, onlyInViewport: true }}
				navigation={{ prevEl: '.swiper-events-prev', nextEl: '.swiper-events-next' }}
				pagination={{ el: '.events-pagination', clickable: true }}
				a11y={{ prevSlideMessage: t('Previous event'), nextSlideMessage: t('Next event') }}
			>
				{recentEvents.map((event) => (
					<SwiperSlide className="event-slide" key={event.eventTitle}>
						<EventCard event={event} />
					</SwiperSlide>
				))}
			</Swiper>
			<div className="events-controls">
				<IconButton className="swiper-events-prev" aria-label={t('Previous event')}>
					<WestIcon />
				</IconButton>
				<div className="events-pagination" />
				<IconButton className="swiper-events-next" aria-label={t('Next event')}>
					<EastIcon />
				</IconButton>
			</div>
			<p className="events-note">
				{t('Community event concepts. Dates and locations will be announced when confirmed.')}
			</p>
		</Stack>
	);
};
export default Events;
