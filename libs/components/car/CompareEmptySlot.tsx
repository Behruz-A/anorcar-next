import React from 'react';
import { Button } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useTranslation } from 'next-i18next';

const CompareEmptySlot = ({ index, onAdd }: { index: number; onAdd: () => void }) => {
	const { t } = useTranslation('common');
	return (
		<article className="compare-empty-slot" data-slot={index}>
			<span className="compare-empty-icon" aria-hidden="true">
				<AddRoundedIcon />
			</span>
			<h3>{t('Select a Vehicle')}</h3>
			<p>{t('Choose a car to compare')}</p>
			<Button
				variant="outlined"
				className="compare-empty-cta"
				onClick={onAdd}
				aria-label={t('Add car to slot {{number}}', { number: index + 1 })}
			>
				{t('Browse Cars')}
			</Button>
		</article>
	);
};
export default CompareEmptySlot;
