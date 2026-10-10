import React from 'react';
import { NextPage } from 'next';
import { Stack, Typography } from '@mui/material';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
const TuiEditor = dynamic(() => import('../community/Teditor'), { ssr: false });

const WriteArticle: NextPage = () => {
	const { t } = useTranslation('common');
	return (
		<section id="write-article-page" className="account-article-card">
			<Stack className="article-card-heading" direction="row">
				<span className="article-section-icon" aria-hidden="true">
					<EditNoteOutlinedIcon />
				</span>
				<div>
					<h2>{t('Create New Article')}</h2>
					<Typography>{t('Write and publish a post for the automotive community.')}</Typography>
				</div>
			</Stack>
			<TuiEditor />
		</section>
	);
};
export default WriteArticle;
