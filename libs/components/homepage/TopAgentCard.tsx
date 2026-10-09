import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Member } from '../../types/member/member';
import { imageUrl } from '../../config';

interface TopAgentProps { agent: Member; }

const DEFAULT_AVATAR = '/img/profile/defaultUser.svg';

const TopAgentCard = ({ agent }: TopAgentProps) => {
 const { t } = useTranslation('common');
 const name = agent.memberFullName?.trim() || agent.memberNick;
 const agentImage = agent.memberImage ? imageUrl(agent.memberImage) : null;
 const [failedImage, setFailedImage] = useState<string | null>(null);
 const isFallback = !agentImage || failedImage === agentImage;

 useEffect(() => {
  setFailedImage(null);
 }, [agentImage]);

 return (
  <Link className="top-agent-card" href={{ pathname: '/agent/detail', query: { agentId: agent._id } }} aria-label={name} title={name}>
   <div className={`agent-portrait${isFallback ? ' agent-portrait-fallback' : ''}`}>
    {isFallback ? (
     <Image className="agent-avatar" src={DEFAULT_AVATAR} alt="" width={128} height={128} unoptimized />
    ) : (
     <Image key={agentImage} src={agentImage} alt="" fill sizes="(max-width: 600px) 250px, (max-width: 1200px) 270px, 284px" unoptimized
      onError={() => setFailedImage(agentImage)} />
    )}
   </div>
   <div className="agent-caption">
    <strong>{name}</strong>
    <span>{t(agent.memberType)}</span>
   </div>
  </Link>
 );
};

export default TopAgentCard;
