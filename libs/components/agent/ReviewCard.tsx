import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { Comment } from '../../types/comment/comment';
import { imageUrl } from '../../config';

const ReviewCard = ({ comment }: { comment: Comment }) => {
	const { t, i18n } = useTranslation('common');
	const [failedImage, setFailedImage] = useState<string | null>(null);
	const portrait = comment.memberData?.memberImage ? imageUrl(comment.memberData.memberImage) : '';
	const date = new Date(comment.createdAt);
	const name = comment.memberData?.memberFullName?.trim() || comment.memberData?.memberNick || t('Member');
	return (
		<article className="review-card">
			<div className="review-card-info">
				<Image
					src={!portrait || failedImage === portrait ? '/img/profile/defaultUser.svg' : portrait}
					alt=""
					width={48}
					height={48}
					unoptimized
					onError={() => setFailedImage(portrait)}
				/>
				<div>
					<strong>{name}</strong>
					{!Number.isNaN(date.getTime()) && (
						<time dateTime={comment.createdAt}>
							{new Intl.DateTimeFormat(i18n.language === 'kr' ? 'ko' : i18n.language, {
								day: 'numeric',
								month: 'short',
								year: 'numeric',
							}).format(date)}
						</time>
					)}
				</div>
			</div>
			<p>{comment.commentContent}</p>
		</article>
	);
};
export default ReviewCard;
