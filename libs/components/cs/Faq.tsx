import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Accordion, AccordionDetails, AccordionSummary, Button } from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import EastRounded from '@mui/icons-material/EastRounded';
import HeadsetMicOutlined from '@mui/icons-material/HeadsetMicOutlined';
import { helpQuestions, helpTopics, HelpCategory } from './helpContent';

interface FaqProps {
	category: HelpCategory;
	search: string;
	onCategoryChange: (category: HelpCategory) => void;
	onReset: () => void;
}
const Faq = ({ category, search, onCategoryChange, onReset }: FaqProps) => {
	const { t, i18n } = useTranslation('common');
	const [expanded, setExpanded] = useState<string | false>('search');
	const query = search.trim().toLocaleLowerCase(i18n.language);
	const questions = helpQuestions.filter(
		(item) =>
			(category === 'all' || item.category === category) &&
			(!query ||
				[t(item.question), t(item.answer), t(helpTopics.find((topic) => topic.id === item.category)?.title ?? '')]
					.join(' ')
					.toLocaleLowerCase(i18n.language)
					.includes(query)),
	);
	const firstQuestion = questions[0]?.id ?? false;
	useEffect(() => {
		setExpanded(firstQuestion);
	}, [firstQuestion, category, query]);
	return (
		<section className="cs-faq" id="cs-faq" aria-labelledby="cs-faq-heading">
			<aside className="cs-faq-aside">
				<span className="cs-kicker">{t('Answers at a glance')}</span>
				<h2 id="cs-faq-heading">{t('Frequently asked questions')}</h2>
				<p>{t('Practical answers to help you keep moving.')}</p>
				<div className="cs-contact-card">
					<HeadsetMicOutlined />
					<h3>{t('Still need a hand?')}</h3>
					<p>{t('Tell us what happened and include the page address. Our team can help you find the next step.')}</p>
					<a href="mailto:info@anorcar.com" className="cs-contact-button">
						{t('Email support')}
						<EastRounded fontSize="small" />
					</a>
					<span>info@anorcar.com</span>
				</div>
			</aside>
			<div className="cs-faq-main">
				<div className="cs-category-filters" role="group" aria-label={t('Help categories')}>
					<button type="button" aria-pressed={category === 'all'} onClick={() => onCategoryChange('all')}>
						{t('All questions')}
					</button>
					{helpTopics.map((topic) => (
						<button
							type="button"
							key={topic.id}
							aria-pressed={category === topic.id}
							onClick={() => onCategoryChange(topic.id)}
						>
							{t(topic.title)}
						</button>
					))}
				</div>
				{search && (
					<div className="cs-search-summary" role="status">
						<span>
							{t('Results for')} “{search}” ({questions.length})
						</span>
						<Button onClick={onReset}>{t('Clear search')}</Button>
					</div>
				)}
				<div className="cs-faq-list">
					{questions.map((item) => (
						<Accordion
							key={item.id}
							disableGutters
							elevation={0}
							expanded={expanded === item.id}
							onChange={(_event, value) => setExpanded(value ? item.id : false)}
						>
							<AccordionSummary
								expandIcon={<AddRounded />}
								id={`cs-question-${item.id}`}
								aria-controls={`cs-answer-${item.id}`}
							>
								<span className="cs-question-mark" aria-hidden="true">
									?
								</span>
								<span>{t(item.question)}</span>
							</AccordionSummary>
							<AccordionDetails id={`cs-answer-${item.id}`}>
								<p>{t(item.answer)}</p>
								{item.href.startsWith('mailto:') ? (
									<a className="cs-answer-link" href={item.href}>
										{t(item.action)}
										<EastRounded fontSize="small" />
									</a>
								) : (
									<Link className="cs-answer-link" href={item.href}>
										{t(item.action)}
										<EastRounded fontSize="small" />
									</Link>
								)}
							</AccordionDetails>
						</Accordion>
					))}
				</div>
				{questions.length === 0 && (
					<div className="cs-empty" role="status">
						<h3>{t('No matching answers')}</h3>
						<p>{t('Try another keyword or browse all help topics.')}</p>
						<Button onClick={onReset}>{t('Show all questions')}</Button>
					</div>
				)}
			</div>
		</section>
	);
};
export default Faq;
