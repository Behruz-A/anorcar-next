import React, { useEffect, useState } from 'react';
import { IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useTranslation } from 'next-i18next';

const slides = [
	{ title: 'Your Next Journey', description: 'Find the car that takes you there.' },
	{ title: 'Find Your Car', description: 'Search by make, model, year, and price.' },
	{ title: 'Electric & Hybrid', description: 'Explore a new way to drive.' },
];

const Hero = ({ compact = false }: { compact?: boolean }) => {
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

	if (compact) {
		return (
			<Stack className="homepage-hero">
				<Stack className="container hero-container">
					<div className="hero-copy">
						<Typography component="h1">{t('Find Your Car')}</Typography>
						<Typography className="hero-description">{t('Find the car that takes you there.')}</Typography>
					</div>
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack className="homepage-hero">
			<Stack className="container hero-container">
				<div className="hero-copy" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
					<Typography component="h1">{t(slide.title)}</Typography>
					<Typography className="hero-description">{t(slide.description)}</Typography>
				</div>
				<Stack className="hero-controls">
					<IconButton aria-label={t('Previous slide')} onClick={() => changeSlide(-1)}><ArrowBackIosNewIcon /></IconButton>
					<IconButton aria-label={t('Next slide')} onClick={() => changeSlide(1)}><ArrowForwardIosIcon /></IconButton>
					<IconButton aria-label={t(playing ? 'Pause slideshow' : 'Play slideshow')} aria-pressed={playing}
						onClick={() => setPlaying((value) => !value)}>{playing ? <PauseIcon /> : <PlayArrowIcon />}</IconButton>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Hero;
