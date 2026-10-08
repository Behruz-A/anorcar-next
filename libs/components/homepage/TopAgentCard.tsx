import { useTranslation } from 'next-i18next';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Member } from '../../types/member/member';
import { imageUrl } from '../../config';

interface TopAgentProps { agent: Member; }

const TopAgentCard = ({ agent }: TopAgentProps) => {
 const { t } = useTranslation('common');
 const name = agent.memberFullName?.trim() || agent.memberNick;
 const agentImage = agent.memberImage ? imageUrl(agent.memberImage) : '/img/profile/defaultUser.svg';

 return (
  <Link className="top-agent-card" href={{ pathname: '/agent/detail', query: { agentId: agent._id } }} aria-label={name}>
   <div className="agent-portrait">
    <Image src={agentImage} alt={name} fill sizes="(max-width: 600px) 250px, (max-width: 1200px) 270px, 300px" unoptimized
     onError={(event) => { if (!event.currentTarget.src.endsWith('/img/profile/defaultUser.svg')) event.currentTarget.src = '/img/profile/defaultUser.svg'; }} />
   </div>
   <div className="agent-caption">
    <strong>{name}</strong>
    <span>{t(agent.memberType)}</span>
   </div>
  </Link>
 );
};

export default TopAgentCard;
