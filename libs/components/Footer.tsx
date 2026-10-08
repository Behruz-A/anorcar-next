import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Stack, Button, IconButton } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { FaInstagram, FaYoutube, FaTiktok, FaTelegramPlane, FaLinkedinIn, FaApple, FaGooglePlay } from 'react-icons/fa';
import { useTranslation } from 'next-i18next';
import { Direction } from '../enums/common.enum';
import { CarCondition } from '../enums/car.enum';
import { CarsInquiry } from '../types/car/car.input';

const carsHref = (condition?: CarCondition, featured = false) => {
 const input: CarsInquiry = { page: 1, limit: 9, sort: featured ? 'carRank' : 'createdAt', direction: Direction.DESC,
  search: condition ? { conditions: [condition] } : {} };
 return { pathname: '/car', query: { input: JSON.stringify(input) } };
};

const Footer = () => {
 const { t } = useTranslation('common');
 const backToTopHandler = () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
 return (
  <Stack component="footer" className="footer-container anorcar-footer">
   <div className="footer-content">
    <div className="footer-brand">
     <Link passHref href="/" className="footer-logo" aria-label={t('Home')}><Image src="/img/logo/anorcar-footer.svg" alt="ANORCAR" width={260} height={46} /></Link>
     <p className="footer-description">{t('More than cars. A global community of passion, events, and exceptional experiences.')}</p>
     <div className="footer-contact"><span><LocationOnOutlinedIcon />Tashkent, Uzbekistan</span><a href="mailto:info@anorcar.com"><MailOutlineIcon />info@anorcar.com</a></div>
     <h3>{t('Follow Us')}</h3>
     <div className="footer-socials" aria-label={t('Follow Us')}>
      <span title="Instagram"><FaInstagram /></span><span title="YouTube"><FaYoutube /></span><span title="TikTok"><FaTiktok /></span><span title="Telegram"><FaTelegramPlane /></span><span title="LinkedIn"><FaLinkedinIn /></span>
     </div>
    </div>
    <div className="footer-newsletter">
     <h3>{t("Stay in the driver's seat.")}</h3>
     <div className="footer-subscribe-box">
      <input type="email" autoComplete="email" placeholder={t('Your email address')} aria-label={t('Your email address')} />
      <Button type="button" className="footer-subscribe">{t('Subscribe')}</Button>
     </div>
    </div>
    <div className="footer-link-columns">
     <nav aria-label={t('Company')}><h3>{t('Company')}</h3>
      <Link passHref href="/about">{t('About Us')}</Link><span>{t('Events')}</span><Link passHref href="/community">{t('Community')}</Link>
      <span>{t('Services')}</span><span>{t('Careers')}</span><a href="mailto:info@anorcar.com">{t('Contact Us')}</a>
     </nav>
     <nav aria-label={t('Quick Links')}><h3>{t('Quick Links')}</h3>
      <Link passHref href={{ pathname: '/community', query: { articleCategory: 'NEWS' } }}>{t('News')}</Link><Link passHref href="/cs">{t('Help Center')}</Link>
      <span>{t('Terms of Service')}</span><span>{t('Privacy Policy')}</span><Link passHref href={{ pathname: '/cs', query: { tab: 'faq' } }}>{t('FAQ')}</Link>
     </nav>
     <nav aria-label={t('Explore')}><h3>{t('Explore')}</h3>
      <Link passHref href={carsHref(CarCondition.NEW)}>{t('New Cars')}</Link><Link passHref href={carsHref(CarCondition.USED)}>{t('Used Cars')}</Link>
      <Link passHref href="/car">{t('Car Brands')}</Link><span>{t('Car Types')}</span><Link passHref href={carsHref(undefined, true)}>{t('Featured Listings')}</Link>
     </nav>
     <div className="footer-apps"><h3>{t('Our Mobile App')}</h3>
      <button type="button" disabled className="footer-app-badge"><FaApple /><span><small>{t('Download on the')}</small><strong>App Store</strong></span></button>
      <button type="button" disabled className="footer-app-badge"><FaGooglePlay /><span><small>{t('Get it on')}</small><strong>Google Play</strong></span></button>
     </div>
    </div>
   </div>
   <div className="footer-bottom">
    <p>© {new Date().getFullYear()} ANORCAR. {t('All rights reserved.')}</p>
    <div className="footer-legal"><span>{t('Terms of Service')}</span><span aria-hidden="true">·</span><span>{t('Privacy Policy')}</span></div>
    <IconButton className="footer-back-top" onClick={backToTopHandler} aria-label={t('Back to top')}><ArrowUpwardIcon /></IconButton>
   </div>
  </Stack>
 );
};
export default Footer;
