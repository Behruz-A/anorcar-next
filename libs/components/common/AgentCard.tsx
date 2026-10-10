import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { IconButton } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { imageUrl } from '../../config';
import { Member } from '../../types/member/member';
import { CustomJwtPayload } from '../../types/customJwtPayload';

interface AgentCardProps {
	agent: Member;
	likeMemberHandler: (user: CustomJwtPayload, id: string) => Promise<void>;
}
const AgentCard = ({ agent, likeMemberHandler }: AgentCardProps) => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [pending, setPending] = useState(false);
	const [failedImage, setFailedImage] = useState<string | null>(null);
	const photo = agent.memberImage ? imageUrl(agent.memberImage) : '';
	const fallback = !photo || photo === failedImage;
	const name = agent.memberFullName?.trim() || agent.memberNick;
	const liked = Boolean(agent.meLiked?.[0]?.myFavorite);
	const href = { pathname: '/agent/detail', query: { agentId: agent._id } };
	return (
		<article className="agents-profile-card">
			<div className={`agents-photo${fallback ? ' agents-photo-fallback' : ''}`}>
				<Link href={href} aria-label={`${t('View Profile')}: ${name}`}>
					<Image
						fill
						unoptimized
						sizes="(max-width: 480px) 100vw, (max-width: 800px) 50vw, (max-width: 1100px) 33vw, 25vw"
						src={fallback ? '/img/profile/defaultUser.svg' : photo}
						alt={name}
						loading="lazy"
						onError={() => {
							if (!fallback) setFailedImage(photo);
						}}
					/>
				</Link>
				<IconButton
					className="agents-like"
					aria-label={`${t(liked ? 'Unlike agent' : 'Like agent')}: ${name}`}
					aria-pressed={liked}
					disabled={pending}
					onClick={async () => {
						setPending(true);
						try {
							await likeMemberHandler(user, agent._id);
						} finally {
							setPending(false);
						}
					}}
				>
					{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
				</IconButton>
			</div>
			<div className="agents-card-content">
				<Link className="agents-name" href={href}>
					{name}
				</Link>
				<span className="agents-role">{t('Car Agent')}</span>
				<div className="agents-card-meta">
					<span>
						<LocationOnRoundedIcon />
						<span>{agent.memberAddress?.trim() || t('Location not provided')}</span>
					</span>
					<span>
						<DirectionsCarRoundedIcon />
						<span>{t('Agent cars listed', { count: agent.memberCars })}</span>
					</span>
				</div>
				<Link className="agents-profile-link" href={href}>
					{t('View Profile')}
				</Link>
			</div>
		</article>
	);
};
export default AgentCard;
