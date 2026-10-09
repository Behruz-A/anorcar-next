import React, { useState } from 'react';
import { Alert, Button, Skeleton, Stack } from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import CompareCarCard from '../car/CompareCarCard';
import CarComparePicker from '../car/CarComparePicker';
import CompareEmptySlot from '../car/CompareEmptySlot';
import { useCompareSelection } from '../../hooks/useCompareSelection';

const CompareCars = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { slots, ids, pending, errors, initializing, unavailable, selection } = useCompareSelection();
	const [pickerSlot, setPickerSlot] = useState<number | null>(null);
	const [navigating, setNavigating] = useState(false);
	const [navigationError, setNavigationError] = useState(false);
	const selected = slots.filter((car) => car !== null);
	const busy = initializing || pending.some(Boolean);
	const compare = async () => {
		if (selected.length < 2 || busy || navigating) return;
		setNavigating(true);
		setNavigationError(false);
		try {
			const changed = await router.push({
				pathname: '/car/compare',
				query: { ids: selected.map((car) => car!._id).join(',') },
			});
			if (!changed) setNavigationError(true);
		} catch {
			setNavigationError(true);
		} finally {
			setNavigating(false);
		}
	};
	return (
		<Stack component="section" className="compare-cars compare-home-premium" aria-labelledby="compare-cars-heading">
			<div className="compare-container">
				<header className="compare-heading">
					<span className="compare-eyebrow">{t('SMART COMPARISON')}</span>
					<h2 id="compare-cars-heading">{t('Compare Cars. Choose Smarter.')}</h2>
					<p>{t('Compare up to 3 cars side by side and find the perfect match for your needs.')}</p>
				</header>
				{unavailable && <Alert severity="info">{t('An unavailable car was removed from your comparison.')}</Alert>}
				{navigationError && <Alert severity="error">{t('Comparison could not be opened. Please try again.')}</Alert>}
				<div className="compare-selection-grid">
					{slots.map((car, index) =>
						initializing || pending[index] ? (
							<article
								className="compare-slot-loading"
								key={index}
								role="status"
								aria-label={t('Restoring your selection')}
							>
								<Skeleton variant="rounded" height={180} />
								<Skeleton width="70%" height={34} />
								<Skeleton width="45%" height={28} />
								<Skeleton height={90} />
							</article>
						) : errors[index] ? (
							<article className="compare-slot-error" key={index}>
								<p>{t('Your selected car could not be loaded.')}</p>
								<Button onClick={() => selection.retry(index)}>{t('Try again')}</Button>
								<Button onClick={() => selection.remove(index)}>{t('Remove car')}</Button>
							</article>
						) : car ? (
							<CompareCarCard
								key={car._id}
								car={car}
								onRemove={() => selection.remove(index)}
								onReplace={() => setPickerSlot(index)}
							/>
						) : (
							<CompareEmptySlot key={index} index={index} onAdd={() => setPickerSlot(index)} />
						),
					)}
				</div>
				<div className="compare-action-bar">
					<p className="compare-selection-count" role="status" aria-live="polite">
						{busy
							? t('Restoring your selection')
							: t('{{selected}} of {{max}} cars selected', { selected: selected.length, max: 3 })}
					</p>
					<div className="compare-actions">
						<Button
							variant="contained"
							className="compare-primary"
							disabled={selected.length < 2 || busy || navigating}
							onClick={() => void compare()}
						>
							{t('Compare Now')}
						</Button>
						<Button
							className="compare-clear"
							startIcon={<DeleteOutlineRoundedIcon />}
							disabled={!ids.some(Boolean) && !busy}
							onClick={() => {
								selection.clear();
								setPickerSlot(null);
							}}
						>
							{t('Clear All')}
						</Button>
					</div>
				</div>
			</div>
			{pickerSlot !== null && (
				<CarComparePicker
					excludedIds={ids}
					replacing={!!slots[pickerSlot]}
					onAdd={(car) => selection.select(car, pickerSlot)}
					onClose={() => setPickerSlot(null)}
				/>
			)}
		</Stack>
	);
};
export default CompareCars;
