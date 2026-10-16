import React, { useState } from 'react';
import Link from 'next/link';
import { Stack, Tabs, Tab, Alert, CircularProgress } from '@mui/material';
import EastIcon from '@mui/icons-material/East';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import CommunityCard from './CommunityCard';
import { BoardArticle } from '../../types/board-article/board-article';
import { BoardArticlesInquiry } from '../../types/board-article/board-article.input';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { Direction } from '../../enums/common.enum';
import { BoardArticleCategory } from '../../enums/board-article.enum';

const categories = [
 { value: 'ALL', label: 'All Posts', icon: <NewspaperOutlinedIcon /> },
 { value: BoardArticleCategory.NEWS, label: 'News', icon: <NewspaperOutlinedIcon /> },
 { value: BoardArticleCategory.FREE, label: 'Free Board', icon: <ChatBubbleOutlineIcon /> },
 { value: BoardArticleCategory.RECOMMEND, label: 'Recommendations', icon: <ThumbUpOffAltIcon /> },
 { value: BoardArticleCategory.HUMOR, label: 'Humor', icon: <SentimentSatisfiedAltIcon /> },
];

const CommunityBoards = () => {
 const { t } = useTranslation('common');
 const [searchCommunity, setSearchCommunity] = useState<BoardArticlesInquiry>({
  page: 1, limit: 3, sort: 'articleViews', direction: Direction.DESC,
  search: {},
 });
 const [articles, setArticles] = useState<BoardArticle[]>([]);

 /** APOLLO REQUESTS **/
 const { loading, data, error } = useQuery(GET_BOARD_ARTICLES, {
  fetchPolicy: 'network-only', variables: { input: searchCommunity }, notifyOnNetworkStatusChange: true,
  onCompleted: (response: T) => setArticles(response?.getBoardArticles?.list ?? []),
 });

 /** HANDLERS **/
 const categoryChangeHandler = (_event: React.SyntheticEvent, category: BoardArticleCategory | 'ALL') => {
  setArticles([]);
  setSearchCommunity({ ...searchCommunity, page: 1, search: category === 'ALL' ? {} : { articleCategory: category } });
 };

 return (
  <Stack component="section" className="community-board community-highlights" aria-labelledby="community-highlights-heading">
   <Stack className="container">
    <div className="community-heading-row">
     <div>
      <h2 id="community-highlights-heading">{t('From Our Community')}</h2>
      <p className="community-description">{t('Discussions, news, recommendations, and stories from our car community.')}</p>
     </div>
     <Link passHref className="community-view-all" href={{ pathname: '/community', query: searchCommunity.search.articleCategory ? { articleCategory: searchCommunity.search.articleCategory } : {} }}>
      {t('View All Posts')} <EastIcon fontSize="small" />
     </Link>
    </div>
    <Tabs className="community-category-tabs" value={searchCommunity.search.articleCategory ?? 'ALL'} onChange={categoryChangeHandler}
     variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label={t('Community categories')}>
     {categories.map(({ value, label, icon }) => <Tab key={value} value={value} label={t(label)} icon={icon} iconPosition="start"
      id={`community-tab-${value}`} aria-controls="community-highlights-panel" />)}
    </Tabs>
    <div id="community-highlights-panel" role="tabpanel" aria-labelledby={`community-tab-${searchCommunity.search.articleCategory ?? 'ALL'}`}>
     {loading && (!data || articles.length === 0) ? <div className="community-status"><CircularProgress aria-label={t('Loading posts')} /></div> :
      error ? <Alert severity="error">{t('Posts could not be loaded. Please try again.')}</Alert> :
      articles.length === 0 ? <p className="community-status">{t('No posts in this category yet.')}</p> :
      <div className="community-highlight-grid">{articles.map((article) => <CommunityCard key={article._id} article={article} />)}</div>}
    </div>
   </Stack>
  </Stack>
 );
};

export default CommunityBoards;
