import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import EastIcon from '@mui/icons-material/East';
import { useTranslation } from 'next-i18next';
import { BoardArticle } from '../../types/board-article/board-article';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { imageUrl } from '../../config';
import { articleExcerpt } from '../../community';

interface CommunityCardProps { article: BoardArticle; }
const categoryLabels = {
 [BoardArticleCategory.NEWS]: 'News', [BoardArticleCategory.FREE]: 'Free Board',
 [BoardArticleCategory.RECOMMEND]: 'Recommendations', [BoardArticleCategory.HUMOR]: 'Humor',
};

const CommunityCard = ({ article }: CommunityCardProps) => {
 const { t, i18n } = useTranslation('common');
 const [imageFailed, setImageFailed] = useState(false);
 const date = new Date(article.createdAt);
 const locale = i18n.language === 'kr' ? 'ko-KR' : i18n.language === 'ru' ? 'ru-RU' : 'en-US';
 const categoryIcon = article.articleCategory === BoardArticleCategory.NEWS ? <NewspaperOutlinedIcon /> :
  article.articleCategory === BoardArticleCategory.RECOMMEND ? <ThumbUpOffAltIcon /> :
  article.articleCategory === BoardArticleCategory.HUMOR ? <SentimentSatisfiedAltIcon /> : <ChatBubbleOutlineIcon />;
 return (
  <Link passHref className="community-highlight-card"
   href={{ pathname: '/community/detail', query: { articleCategory: article.articleCategory, id: article._id } }} aria-label={article.articleTitle}>
   <div className="community-post-cover">
    <Image className="community-post-image" src={imageFailed || !article.articleImage ? '/img/event.svg' : imageUrl(article.articleImage)} alt={article.articleTitle}
     fill unoptimized sizes="(max-width: 600px) calc(100vw - 28px), (max-width: 1200px) 46vw, (max-width: 1808px) 31vw, 544px" onError={() => setImageFailed(true)} />
    <span className="community-category-badge">{categoryIcon}{t(categoryLabels[article.articleCategory])}</span>
   </div>
   <div className="community-post-caption">
    <h3 title={article.articleTitle}>{articleExcerpt(article.articleTitle, 90)}</h3>
    <p className="community-post-excerpt">{articleExcerpt(article.articleContent, 160) || t('Read the discussion')}</p>
    <div className="community-post-meta">
     <span><CalendarMonthOutlinedIcon /><time dateTime={article.createdAt}>{Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)}</time></span>
     <span title={t('Views')}><VisibilityOutlinedIcon />{new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(article.articleViews)}</span>
     <span title={t('Comments')}><ChatBubbleOutlineIcon />{article.articleComments}</span>
     <span className="community-post-arrow" aria-hidden="true"><EastIcon /></span>
    </div>
   </div>
  </Link>
 );
};
export default CommunityCard;
