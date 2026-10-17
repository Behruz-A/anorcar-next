import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { Button, IconButton } from '@mui/material';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined';
import EastOutlinedIcon from '@mui/icons-material/EastOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { AgentLanguage } from '../../enums/member.enum';
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
	followMemberHandler?: (user: CustomJwtPayload, id: string, following: boolean) => Promise<void>;
}
const AgentCard = ({ agent, likeMemberHandler, followMemberHandler }: AgentCardProps) => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [pending, setPending] = useState(false);
	const busy = React.useRef(false);
	const [failedImage, setFailedImage] = useState<string | null>(null);
	const photo = agent.memberImage ? imageUrl(agent.memberImage) : '';
	const fallback = !photo || photo === failedImage;
	const name = agent.memberFullName?.trim() || agent.memberNick;
	const liked = Boolean(agent.meLiked?.[0]?.myFavorite);
	const following = Boolean(agent.meFollowed?.[0]?.myFollowing);
	const isSelf = user._id === agent._id;
	const languages: Record<AgentLanguage, string> = {
		ENGLISH: 'English',
		KOREAN: 'Korean',
		RUSSIAN: 'Russian',
		UZBEK: 'Uzbek',
		CHINESE: 'Chinese',
		JAPANESE: 'Japanese',
		ARABIC: 'Arabic',
	};
	const href = { pathname: '/agent/detail', query: { agentId: agent._id } };
	const interact = async (action: 'like' | 'follow') => {
		if (busy.current || isSelf) return;
		busy.current = true;
		setPending(true);
		try {
			if (action === 'like') await likeMemberHandler(user, agent._id);
			else await followMemberHandler?.(user, agent._id, following);
		} finally {
			busy.current = false;
			setPending(false);
		}
	};
	return (
		<article className="agents-profile-card">
			<div className={`agents-photo${fallback ? ' agents-photo-fallback' : ''}`}>
				<Link href={href} aria-label={`${t('View Profile')}: ${name}`}>
					<Image
						fill
						unoptimized
						sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
					disabled={pending || isSelf}
					onClick={() => void interact('like')}
				>
					{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
				</IconButton>
			</div>
			<div className="agents-card-content">
				<Link className="agents-name" href={href}>
					{name}
				</Link>
				<span className="agents-role">
					{t(
						agent.agentType === 'DEALERSHIP'
							? 'Dealership'
							: agent.agentType === 'INDEPENDENT'
							? 'Independent Agent'
							: 'Car Agent',
					)}
				</span>
				<div className="agents-card-meta">
					<span>
						<LocationOnRoundedIcon />
						<span>{agent.memberAddress?.trim() || t('Location not provided')}</span>
					</span>
					<span>
						<TranslateOutlinedIcon />
						<span>
							{agent.agentLanguages?.length
								? agent.agentLanguages.map((language) => t(languages[language] ?? language)).join(' · ')
								: t('Languages not provided')}
						</span>
					</span>
				</div>
				<div className="agents-card-stats">
					<span>
						<DirectionsCarRoundedIcon />
						{t('Agent cars listed', { count: agent.memberCars })}
					</span>
					<span title={t('Views')}>
						<VisibilityOutlinedIcon />
						{agent.memberViews}
					</span>
					<span title={t('Likes')}>
						<FavoriteBorderIcon />
						{agent.memberLikes}
					</span>
				</div>
				<div className="agents-card-actions">
					{followMemberHandler && !isSelf && (
						<Button
							className="agents-follow"
							variant="outlined"
							disabled={pending}
							aria-pressed={following}
							startIcon={following ? <CheckIcon /> : <PersonAddAltOutlinedIcon />}
							onClick={() => void interact('follow')}
						>
							{t(following ? 'Following' : 'Follow')}
						</Button>
					)}
					<Link className="agents-profile-link" href={href}>
						{t('View Profile')}
						<EastOutlinedIcon />
					</Link>
				</div>
			</div>
		</article>
	);
};
export default AgentCard;
