import React, { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Stack } from '@mui/material';
import EastRounded from '@mui/icons-material/EastRounded';
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined';
import SellOutlined from '@mui/icons-material/SellOutlined';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import ForumOutlined from '@mui/icons-material/ForumOutlined';
import BuildOutlined from '@mui/icons-material/BuildOutlined';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import Faq from '../../libs/components/cs/Faq';
import Notice from '../../libs/components/cs/Notice';
import { helpTopics, HelpCategory } from '../../libs/components/cs/helpContent';
import Inquiry from '../../libs/components/cs/Inquiry';
import HeadsetMicOutlined from '@mui/icons-material/HeadsetMicOutlined';
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});
const topicIcons = [
	DirectionsCarOutlined,
	SellOutlined,
	PersonOutlineRounded,
	StorefrontOutlined,
	ForumOutlined,
	BuildOutlined,
];
const CS: NextPage = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [search, setSearch] = useState('');
	const [category, setCategory] = useState<HelpCategory>('all');
	const restored = useRef(false);
	useEffect(() => {
		if (!router.isReady) return;
		const value = typeof router.query.q === 'string' ? router.query.q.slice(0, 160) : '';
		const selected = helpTopics.find((topic) => topic.id === router.query.topic)?.id ?? 'all';
		setSearch(value);
		setCategory(selected);
		if (!restored.current) {
			if (router.query.tab === 'faq' || value || selected !== 'all')
				document.getElementById('cs-faq')?.scrollIntoView();
			else if (router.query.tab === 'notice') document.getElementById('cs-updates')?.scrollIntoView();
			restored.current = true;
		}
	}, [router.isReady, router.query.q, router.query.topic, router.query.tab]);
	const chooseHelp = (topic: HelpCategory, value = search) => {
		setCategory(topic);
		setSearch(value);
		void router.replace(
			{ pathname: '/cs', query: { tab: 'faq', ...(topic !== 'all' ? { topic } : {}), ...(value ? { q: value } : {}) } },
			undefined,
			{ shallow: true, scroll: false },
		);
		document
			.getElementById('cs-faq')
			?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
	};
	return (
		<Stack component="main" className="cs-page" id="cs-help-center">
			<Head>
				<title>{`${t('Help Center')} | ANORCAR`}</title>
				<meta name="description" content={t('Find answers, explore guides, and get the support you need.')} />
			</Head>
			<section className="cs-hero" aria-labelledby="cs-title">
				<div className="cs-container">
					<h1 id="cs-title">{t('Help Center')}</h1>
					<p>{t('Find answers, explore guides, and get the support you need.')}</p>
				</div>
			</section>
			<div className="cs-container cs-body">
				<section className="cs-topics" id="cs-topics" aria-labelledby="cs-topics-heading">
					<div className="cs-section-heading">
						<div>
							<h2 id="cs-topics-heading">{t('Explore help topics')}</h2>
							<p>{t('A little guidance for every step of your car journey.')}</p>
						</div>
					</div>
					<div className="cs-topic-grid">
						{helpTopics.map((topic, index) => {
							const Icon = topicIcons[index];
							return (
								<button type="button" className="cs-topic-card" key={topic.id} onClick={() => chooseHelp(topic.id, '')}>
									<span className="cs-topic-icon">
										<Icon />
									</span>
									<h3>{t(topic.title)}</h3>
									<p>{t(topic.description)}</p>
									<span className="cs-topic-action">
										{t('Explore answers')}
										<EastRounded fontSize="small" />
									</span>
								</button>
							);
						})}
					</div>
				</section>
				<Faq
					category={category}
					search={search}
					onCategoryChange={(value) => chooseHelp(value)}
					onReset={() => chooseHelp('all', '')}
				/>
				<section className="cs-support-banner" aria-labelledby="cs-support-heading">
					<span className="cs-support-symbol">
						<HeadsetMicOutlined />
					</span>
					<div>
						<h2 id="cs-support-heading">{t('Still need a hand?')}</h2>
						<p>{t('Find the right answer or reach out to our team.')}</p>
					</div>
					<div className="cs-support-actions">
						<button type="button" className="cs-support-primary" onClick={() => window.dispatchEvent(new Event('anorcar:open-ai'))}>
							{t('Ask AI Assistant')}
							<EastRounded fontSize="small" />
						</button>
						<a href="#cs-contact" className="cs-support-secondary">
							<MailOutlineRounded fontSize="small" />
							{t('Contact support')}
						</a>
					</div>
				</section>
				<Notice />
				<Inquiry />
			</div>
		</Stack>
	);
};
export default withLayoutBasic(CS);
