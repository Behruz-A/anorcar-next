import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import { useTranslation } from 'next-i18next';
import { BoardArticle } from '../../types/board-article/board-article';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { imageUrl } from '../../config';

interface CommunityCardProps { vertical: boolean; article: BoardArticle; index: number; }
const categoryLabels = {
 [BoardArticleCategory.NEWS]: 'News', [BoardArticleCategory.FREE]: 'Free Board',
 [BoardArticleCategory.RECOMMEND]: 'Recommendations', [BoardArticleCategory.HUMOR]: 'Humor',
};

const CommunityCard = ({ article, vertical, index }: CommunityCardProps) => {
 const { t, i18n } = useTranslation('common');
 const [imageFailed, setImageFailed] = useState(false);
 const date = new Date(article.createdAt);
 const locale = i18n.language === 'kr' ? 'ko-KR' : i18n.language === 'ru' ? 'ru-RU' : 'en-US';
 const categoryIcon = article.articleCategory === BoardArticleCategory.NEWS ? <NewspaperOutlinedIcon /> :
  article.articleCategory === BoardArticleCategory.RECOMMEND ? <ThumbUpOffAltIcon /> :
  article.articleCategory === BoardArticleCategory.HUMOR ? <SentimentSatisfiedAltIcon /> : <ChatBubbleOutlineIcon />;
 return (
  <Link passHref className={`community-highlight-card ${vertical ? 'community-featured' : index === 3 ? 'community-wide' : ''}`}
   href={{ pathname: '/community/detail', query: { articleCategory: article.articleCategory, id: article._id } }} aria-label={article.articleTitle}>
   <Image className="community-post-image" src={imageFailed || !article.articleImage ? '/img/event.svg' : imageUrl(article.articleImage)} alt={article.articleTitle}
    fill unoptimized sizes={vertical ? '(max-width: 900px) 100vw, 710px' : '(max-width: 600px) 100vw, 710px'} onError={() => setImageFailed(true)} />
   <span className="community-category-badge">{categoryIcon}{t(categoryLabels[article.articleCategory])}</span>
   <div className="community-post-caption">
    <h3>{article.articleTitle}</h3>
    <div className="community-post-meta">
     <span><CalendarMonthOutlinedIcon /><time dateTime={article.createdAt}>{Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)}</time></span>
     <span><VisibilityOutlinedIcon />{new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(article.articleViews)}</span>
     <span><ChatBubbleOutlineIcon />{article.articleComments}</span>
    </div>
   </div>
  </Link>
 );
};
export default CommunityCard;
