import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Button, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ArrowOutwardRounded from '@mui/icons-material/ArrowOutwardRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import CompareArrowsRounded from '@mui/icons-material/CompareArrowsRounded';
import PriceCheckRounded from '@mui/icons-material/PriceCheckRounded';
import ForumOutlined from '@mui/icons-material/ForumOutlined';
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../../apollo/store';
import { GET_MARKETPLACE_OVERVIEW } from '../../../apollo/user/query';
import { Direction } from '../../enums/common.enum';
import { MemberType } from '../../enums/member.enum';
import { Cars } from '../../types/car/car';
import { Members } from '../../types/member/member';
import { Brand } from '../../types/brand/brand';
import { i18n as localeConfig } from '../../../next-i18next.config';
import { HOME_PROMOTIONAL_VIDEO_URL, youtubeVideoId } from '../../config';

const videoId = youtubeVideoId(HOME_PROMOTIONAL_VIDEO_URL);

interface Overview {
	getCars: Pick<Cars, 'metaCounter'>;
	getAgents: Pick<Members, 'metaCounter'>;
	getBrands: Pick<Brand, '_id'>[];
}
const features = [
	{
		title: 'Find Your Next Car',
		text: 'Explore available vehicles by brand, price, model year, and location.',
		icon: DirectionsCarOutlined,
	},
	{
		title: 'Compare with Confidence',
		text: 'Compare vehicle prices and specifications side by side before making a decision.',
		icon: CompareArrowsRounded,
	},
	{
		title: 'Explore Prices in KRW',
		text: 'Browse vehicle prices in Korean won and find options that match your budget.',
		icon: PriceCheckRounded,
	},
	{
		title: 'Connect with Sellers',
		text: "Contact agents directly through ANORCAR's existing private messaging experience.",
		icon: ForumOutlined,
	},
];

export default function SellerShowcase() {
	const { t, i18n } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [visible, setVisible] = useState(false);
	const [videoOpen, setVideoOpen] = useState(false);
	const playButton = useRef<HTMLButtonElement>(null);
	const root = useRef<HTMLElement>(null);
	useEffect(() => {
		if (!root.current) return;
		if (!('IntersectionObserver' in window)) {
			setVisible(true);
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin: '200px' },
		);
		observer.observe(root.current);
		return () => observer.disconnect();
	}, []);
	const { data, loading, error, refetch } = useQuery<Overview>(GET_MARKETPLACE_OVERVIEW, {
		variables: {
			cars: { page: 1, limit: 1, sort: 'createdAt', direction: Direction.DESC, search: {} },
			agents: { page: 1, limit: 1, sort: 'memberRank', direction: Direction.DESC, search: {} },
		},
		fetchPolicy: 'no-cache',
		skip: !visible,
		context: { skipGlobalError: true },
	});
	const locale = i18n.language === 'kr' ? 'ko-KR' : i18n.language;
	const count = (value: number | null | undefined) =>
		loading || error || value == null ? '—' : value.toLocaleString(locale);
	const metrics = [
		{
			value: count(data?.getCars.metaCounter?.length === 0 ? 0 : data?.getCars.metaCounter?.[0]?.total),
			label: 'Cars for sale',
		},
		{
			value: count(data?.getAgents.metaCounter?.length === 0 ? 0 : data?.getAgents.metaCounter?.[0]?.total),
			label: 'Active agents',
		},
		{ value: count(data?.getBrands.length), label: 'Car brands' },
		{ value: localeConfig.locales.length.toLocaleString(locale), label: 'Languages supported' },
	];
	const isAgent = Boolean(user._id) && user.memberType === MemberType.AGENT;
	const ctaHref = isAgent ? '/mypage?category=addCar' : '/car';
	const ctaText = isAgent ? 'List Your Car' : 'Explore Cars';
	const benefits = isAgent
		? ['Create a detailed vehicle listing', 'Connect with interested buyers', 'Manage your listings in one place']
		: ['Explore cars that match your needs', 'Compare prices and specifications', 'Contact sellers directly'];
	return (
		<section ref={root} className="seller-showcase" aria-labelledby="seller-showcase-heading">
			<div className="seller-showcase-split">
				<div className="seller-showcase-media">
					<Image
						src="/img/carimg21.png"
						alt={t('A sports car on a scenic road')}
						fill
						loading={visible ? 'eager' : 'lazy'}
						sizes="(max-width: 800px) 100vw, 50vw"
					/>
					{videoId && (
						<button
							ref={playButton}
							type="button"
							className="seller-showcase-play"
							aria-label={t('Play video')}
							onClick={() => setVideoOpen(true)}
						>
							<PlayArrowRounded aria-hidden="true" />
						</button>
					)}
				</div>
				<div className="seller-showcase-copy">
					<div className="seller-showcase-copy-inner">
						<span className="seller-showcase-eyebrow">{t(isAgent ? 'SELL WITH ANORCAR' : 'DISCOVER ANORCAR')}</span>
						<h2 id="seller-showcase-heading">
							{t(isAgent ? 'Your Car. Your Next Buyer.' : 'Find a Car That Moves You.')}
						</h2>
						<p>
							{t(
								isAgent
									? 'Create a detailed listing, showcase your vehicle, and connect with interested buyers.'
									: 'Explore vehicles, compare your options, and connect with sellers to find your next car.',
							)}
						</p>
						<ul>
							{benefits.map((text) => (
								<li key={text}>
									<span aria-hidden="true">
										<CheckRounded />
									</span>
									{t(text)}
								</li>
							))}
						</ul>
						<Button component={Link} href={ctaHref} variant="contained" endIcon={<ArrowOutwardRounded />}>
							{t(ctaText)}
						</Button>
					</div>
				</div>
			</div>
			<div className="container seller-showcase-container">
				<dl className="seller-showcase-metrics" aria-label={t('ANORCAR at a glance')} aria-busy={loading}>
					{metrics.map((metric) => (
						<div key={metric.label}>
							<dt>{t(metric.label)}</dt>
							<dd>{metric.value}</dd>
						</div>
					))}
				</dl>
				{error && (
					<div className="seller-showcase-metrics-error" role="status">
						<span>{t('Marketplace figures could not be loaded.')}</span>
						<button type="button" onClick={() => void refetch()}>
							{t('Try again')}
						</button>
					</div>
				)}
				<div className="seller-showcase-benefits">
					<h2>{t('Why Choose ANORCAR?')}</h2>
					<div className="seller-showcase-benefit-grid">
						{features.map(({ title, text, icon: Icon }) => (
							<article key={title}>
								<Icon aria-hidden="true" />
								<h3>{t(title)}</h3>
								<p>{t(text)}</p>
							</article>
						))}
					</div>
				</div>
			</div>
			{videoId && (
				<Dialog
					open={videoOpen}
					onClose={() => setVideoOpen(false)}
					maxWidth="md"
					fullWidth
					aria-labelledby="showcase-video-title"
					PaperProps={{ className: 'seller-showcase-video-dialog' }}
					TransitionProps={{ onExited: () => playButton.current?.focus() }}
				>
					<DialogTitle id="showcase-video-title">
						{t('Automotive video')}
						<IconButton aria-label={t('Close video')} onClick={() => setVideoOpen(false)}>
							<CloseRounded />
						</IconButton>
					</DialogTitle>
					<DialogContent>
						{videoOpen && (
							<iframe
								title={t('Automotive video')}
								src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
								allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
								allowFullScreen
								referrerPolicy="strict-origin-when-cross-origin"
							/>
						)}
						<a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">
							{t('Watch on YouTube')}
						</a>
					</DialogContent>
				</Dialog>
			)}
		</section>
	);
}
