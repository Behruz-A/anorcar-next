import type { GetStaticProps, NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import SocialCallback from '../../libs/components/account/SocialCallback';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
 props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});

const KakaoCallback: NextPage = () => <SocialCallback provider="kakao" />;
export default KakaoCallback;
