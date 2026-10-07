import { useTranslation } from 'next-i18next';
import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import TwitterIcon from '@mui/icons-material/Twitter';
import useDeviceDetect from '../hooks/useDeviceDetect';
import { Stack, Box } from '@mui/material';
import moment from 'moment';

const Footer = () => {
 const { t } = useTranslation('common');
	const device = useDeviceDetect();

	if (device == 'mobile') {
		return (
			<Stack className={'footer-container'}>
				<Stack className={'main'}>
					<Stack className={'left'}>
						<Box component={'div'} className={'footer-box'}>
							<img src="/img/logo/anorcar-white.svg" alt="" className={'logo'} />
						</Box>
						<Box component={'div'} className={'footer-box'}>
							<span>{t("Customer support")}</span>
							<p>+82 10 4867 2909</p>
						</Box>
						<Box component={'div'} className={'footer-box'}>
							<span>{t("Need help?")}</span>
							<p>+82 10 4867 2909</p>
							<span>{t("Support?")}</span>
						</Box>
						<Box component={'div'} className={'footer-box'}>
							<p>{t("follow us on social media")}</p>
							<div className={'media-box'}>
								<FacebookOutlinedIcon />
								<TelegramIcon />
								<InstagramIcon />
								<TwitterIcon />
							</div>
						</Box>
					</Stack>
					<Stack className={'right'}>
						<Box component={'div'} className={'bottom'}>
							<div>
								<strong>{t("Popular Search")}</strong>
								<span>{t("Cars for rent")}</span>
								<span>{t("Browse cars")}</span>
							</div>
							<div>
								<strong>{t("Quick Links")}</strong>
								<span>{t("Terms of Use")}</span>
								<span>{t("Privacy Policy")}</span>
								<span>{t("Pricing Plans")}</span>
								<span>{t("Our Services")}</span>
								<span>{t("Contact Support")}</span>
								<span>{t("FAQs")}</span>
							</div>
							<div>
								<strong>{t("Discover")}</strong>
								<span>{t("Seoul")}</span>
								<span>{t("Gyeongido")}</span>
								<span>{t("Busan")}</span>
								<span>{t("Jejudo")}</span>
							</div>
						</Box>
					</Stack>
				</Stack>
				<Stack className={'second'}>
					<span>© ANORCAR - All rights reserved. ANORCAR {moment().year()}</span>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'footer-container'}>
				<Stack className={'main'}>
					<Stack className={'left'}>
						<Box component={'div'} className={'footer-box'}>
							<img src="/img/logo/anorcar-white.svg" alt="" className={'logo'} />
						</Box>
						<Box component={'div'} className={'footer-box'}>
							<span>{t("Customer support")}</span>
							<p>+82 10 4867 2909</p>
						</Box>
						<Box component={'div'} className={'footer-box'}>
							<span>{t("Need help?")}</span>
							<p>+82 10 4867 2909</p>
							<span>{t("Support?")}</span>
						</Box>
						<Box component={'div'} className={'footer-box'}>
							<p>{t("follow us on social media")}</p>
							<div className={'media-box'}>
								<FacebookOutlinedIcon />
								<TelegramIcon />
								<InstagramIcon />
								<TwitterIcon />
							</div>
						</Box>
					</Stack>
					<Stack className={'right'}>
						<Box component={'div'} className={'top'}>
							<strong>{t("keep yourself up to date")}</strong>
							<div>
								<input type="text" placeholder={'Your Email'} />
								<span>{t("Subscribe")}</span>
							</div>
						</Box>
						<Box component={'div'} className={'bottom'}>
							<div>
								<strong>{t("Popular Search")}</strong>
								<span>{t("Cars for rent")}</span>
								<span>{t("Browse cars")}</span>
							</div>
							<div>
								<strong>{t("Quick Links")}</strong>
								<span>{t("Terms of Use")}</span>
								<span>{t("Privacy Policy")}</span>
								<span>{t("Pricing Plans")}</span>
								<span>{t("Our Services")}</span>
								<span>{t("Contact Support")}</span>
								<span>{t("FAQs")}</span>
							</div>
							<div>
								<strong>{t("Discover")}</strong>
								<span>{t("Seoul")}</span>
								<span>{t("Gyeongido")}</span>
								<span>{t("Busan")}</span>
								<span>{t("Jejudo")}</span>
							</div>
						</Box>
					</Stack>
				</Stack>
				<Stack className={'second'}>
					<span>© ANORCAR - All rights reserved. ANORCAR {moment().year()}</span>
					<span>Privacy · Terms · Sitemap</span>
				</Stack>
			</Stack>
		);
	}
};

export default Footer;
