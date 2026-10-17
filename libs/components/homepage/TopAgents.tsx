import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Stack, Alert, CircularProgress, IconButton } from '@mui/material';
import EastIcon from '@mui/icons-material/East';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard, Navigation } from 'swiper/modules';
import TopAgentCard from './TopAgentCard';
import { Member } from '../../types/member/member';
import { AgentsInquiry } from '../../types/member/member.input';
import { Direction } from '../../enums/common.enum';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../../apollo/user/mutation';
import { sweetErrorHandling } from '../../sweetAlert';
import { GET_AGENTS } from '../../../apollo/user/query';
import { T } from '../../types/common';

interface TopAgentsProps { initialInput: AgentsInquiry; }

const TopAgents = ({ initialInput }: TopAgentsProps) => {
 const { t } = useTranslation('common');
 const [topAgents, setTopAgents] = useState<Member[]>([]);
 const user = useReactiveVar(userVar);
 const router = useRouter();
 const [subscribe] = useMutation(SUBSCRIBE);
 const [unsubscribe] = useMutation(UNSUBSCRIBE);
 const [likeMember] = useMutation(LIKE_TARGET_MEMBER);

 /** APOLLO REQUESTS **/
 const { loading: getAgentsLoading, data: getAgentsData, error: getAgentsError, refetch } = useQuery(GET_AGENTS, {
  fetchPolicy: 'cache-and-network',
  variables: { input: initialInput },
  notifyOnNetworkStatusChange: true,
  onCompleted: (data: T) => {
   const list: Member[] = [...(data?.getAgents?.list ?? [])];
   // Preserve rank ordering; recently updated profiles resolve equal-rank ties.
   if (initialInput.sort === 'memberRank') {
    list.sort((a, b) => b.memberRank - a.memberRank || Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
   }
   setTopAgents(list);
  },
 });

 useEffect(() => { refetch().catch(() => undefined); }, [user._id, refetch]);

 const interact = async (agent: Member, action: 'follow' | 'like') => {
  if (!user._id) { await router.push('/account/join'); return; }
  if (user._id === agent._id) return;
  try {
   const mutate = action === 'like' ? likeMember : agent.meFollowed?.[0]?.myFollowing ? unsubscribe : subscribe;
   await mutate({ variables: { input: agent._id } });
   await refetch();
  } catch (error) { await sweetErrorHandling(error); }
 };

 return (
  <Stack component="section" className="top-agents agents-showcase" aria-labelledby="top-agents-heading">
   <Stack className="container">
    <Stack className="info-box">
     <div className="agents-heading">
      <p className="agents-eyebrow">{t('Trusted Experts')}</p>
      <h2 id="top-agents-heading">{t('Top Agents')}</h2>
      <p className="agents-description">{t('Our agents are always ready to serve you.')}</p>
     </div>
     <Link className="agents-view-all" href="/agent">{t('View all agents')} <EastIcon fontSize="small" /></Link>
    </Stack>
    <Stack className="wrapper">
     {getAgentsLoading && !getAgentsData ? <CircularProgress aria-label={t('Loading agents')} /> :
      getAgentsError ? <Alert severity="error">{t('Agents could not be loaded. Please try again.')}</Alert> :
      topAgents.length === 0 ? <p className="agents-empty">{t('No agents yet.')}</p> :
      <>
      <Swiper className="top-agents-swiper" slidesPerView={1.15} spaceBetween={16} watchOverflow
       breakpoints={{ 600: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 20 }, 1440: { slidesPerView: 4, slidesPerGroup: 1, spaceBetween: 24 } }}
       modules={[Keyboard, A11y, Navigation]} keyboard={{ enabled: true, onlyInViewport: true }}
       navigation={{ prevEl: '.swiper-agents-prev', nextEl: '.swiper-agents-next' }}
       a11y={{ prevSlideMessage: t('Previous agents'), nextSlideMessage: t('Next agents') }}>
       {topAgents.map((agent) => (
        <SwiperSlide className="top-agents-slide" key={agent._id}>
         <TopAgentCard agent={agent} isSelf={user._id === agent._id} onInteract={interact} />
        </SwiperSlide>
       ))}
      </Swiper>
      <Stack className="agents-controls">
       <IconButton className="swiper-agents-prev" aria-label={t('Previous agents')}><ArrowBackIosNewIcon /></IconButton>
       <IconButton className="swiper-agents-next" aria-label={t('Next agents')}><ArrowForwardIosIcon /></IconButton>
      </Stack>
      </>}
    </Stack>
   </Stack>
  </Stack>
 );
};

TopAgents.defaultProps = {
 initialInput: { page: 1, limit: 10, sort: 'memberRank', direction: Direction.DESC, search: {} },
};

export default TopAgents;
