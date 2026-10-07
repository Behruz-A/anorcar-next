import React, { useEffect, useState } from 'react';
import { IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useTranslation } from 'next-i18next';

const slides = [
	{ title: 'Your Next Car', accent: 'Starts', ending: 'Here.', description: 'Explore new and used cars from agents.', detail: 'Compare prices and find the right car for you.' },
	{ title: 'Find Your Car', accent: 'Your', ending: 'Way.', description: 'Search by make, model, year, and price.', detail: 'Choose the car that fits your next journey.' },
	{ title: 'Electric & Hybrid', accent: 'A New', ending: 'Direction.', description: 'Explore electric and hybrid cars in one place.', detail: 'Find your next car with ANORCAR.' },
];

const Hero = () => {
	const { t } = useTranslation('common');
	const [slideIndex, setSlideIndex] = useState(0);
	const [playing, setPlaying] = useState(false);
	const slide = slides[slideIndex];

	/** LIFECYCLES **/
	useEffect(() => {
		if (!playing) return;
		const interval = window.setInterval(() => setSlideIndex((index) => (index + 1) % slides.length), 6500);
		return () => window.clearInterval(interval);
	}, [playing]);

	/** HANDLERS **/
	const changeSlide = (direction: number) => setSlideIndex((index) => (index + direction + slides.length) % slides.length);

	return (
		<Stack className="homepage-hero">
			<Stack className="container hero-container">
				<div className="hero-copy" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
					<Typography className="hero-eyebrow">{t('FIND · COMPARE · CHOOSE')}</Typography>
					<Typography component="h1">{t(slide.title)}<br /><span>{t(slide.accent)}</span> {t(slide.ending)}</Typography>
					<Typography className="hero-description">{t(slide.description)}<br />{t(slide.detail)}</Typography>
				</div>
				<Stack className="hero-controls">
					<IconButton aria-label={t('Previous slide')} onClick={() => changeSlide(-1)}><ArrowBackIosNewIcon /></IconButton>
					<IconButton aria-label={t('Next slide')} onClick={() => changeSlide(1)}><ArrowForwardIosIcon /></IconButton>
					<IconButton aria-label={t(playing ? 'Pause slideshow' : 'Play slideshow')} aria-pressed={playing}
						onClick={() => setPlaying((value) => !value)}>{playing ? <PauseIcon /> : <PlayArrowIcon />}</IconButton>
				</Stack>
				<Stack className="hero-deal">
					<LocalOfferIcon />
					<div><strong>{t('Great Deals')}</strong><span>{t('New & Used Cars')}<br />{t('in One Place')}</span></div>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Hero;
