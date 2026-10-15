import { useTranslation } from 'next-i18next';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Member } from '../../types/member/member';
import { imageUrl } from '../../config';
import { Button, IconButton } from '@mui/material';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import CheckIcon from '@mui/icons-material/Check';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

interface TopAgentProps {
 agent: Member;
 isSelf: boolean;
 onInteract: (agent: Member, action: 'follow' | 'like') => Promise<void>;
}

const DEFAULT_AVATAR = '/img/profile/defaultUser.svg';

const TopAgentCard = ({ agent, isSelf, onInteract }: TopAgentProps) => {
 const { t } = useTranslation('common');
 const name = agent.memberFullName?.trim() || agent.memberNick;
 const agentImage = agent.memberImage ? imageUrl(agent.memberImage) : null;
 const [failedImage, setFailedImage] = useState<string | null>(null);
 const isFallback = !agentImage || failedImage === agentImage;
 const [pending, setPending] = useState(false);
 const busy = useRef(false);
 const following = !!agent.meFollowed?.[0]?.myFollowing;
 const liked = !!agent.meLiked?.[0]?.myFavorite;
 const href = { pathname: '/agent/detail', query: { agentId: agent._id } };
 const handleAction = async (action: 'follow' | 'like') => {
  if (busy.current || isSelf) return;
  busy.current = true;
  setPending(true);
  try { await onInteract(agent, action); }
  finally { busy.current = false; setPending(false); }
 };

 useEffect(() => {
  setFailedImage(null);
 }, [agentImage]);

 return (
  <article className="top-agent-card">
   <div className="agent-photo-wrap">
   <Link href={href} aria-label={name} className={`agent-portrait${isFallback ? ' agent-portrait-fallback' : ''}`}>
    {isFallback ? (
     <Image className="agent-avatar" src={DEFAULT_AVATAR} alt="" width={128} height={128} unoptimized />
    ) : (
     <Image key={agentImage} src={agentImage} alt="" fill sizes="(max-width: 600px) 85vw, (max-width: 1439px) 45vw, 400px" unoptimized
      onError={() => setFailedImage(agentImage)} />
    )}
   </Link>
   {!isSelf && <IconButton className="agent-like" aria-label={`${t(liked ? 'Unlike agent' : 'Like agent')}: ${name}`}
    aria-pressed={liked} disabled={pending} onClick={() => handleAction('like')}>
    {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
   </IconButton>}
   </div>
   <div className="agent-caption">
    <div className="agent-name-row">
     <Link className="agent-name" href={href}>{name}</Link>
     {!isSelf && <Button className="agent-follow" variant="outlined" disabled={pending} aria-pressed={following}
      startIcon={following ? <CheckIcon /> : <PersonAddAltOutlinedIcon />} onClick={() => handleAction('follow')}>
      {t(following ? 'Following' : 'Follow')}
     </Button>}
    </div>
    <p className="agent-location">{agent.memberAddress?.trim() || t('Car Agent')}</p>
    <div className="agent-stats">
     <span>{t('Agent cars listed', { count: agent.memberCars })}</span>
     <span className="agent-views"><VisibilityOutlinedIcon />{agent.memberViews}</span>
    </div>
    <Link className="agent-view-profile" href={href}>{t('View Agent')}</Link>
   </div>
  </article>
 );
};

export default TopAgentCard;
