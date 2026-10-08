import { NextPage } from 'next';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import CommunityBoards from '../libs/components/homepage/CommunityBoards';
import PopularCars from '../libs/components/homepage/PopularCars';
import TopAgents from '../libs/components/homepage/TopAgents';
import RecentlyAddedCars from '../libs/components/homepage/RecentlyAddedCars';
import Events from '../libs/components/homepage/Events';
import BrowseByBudget from '../libs/components/homepage/BrowseByBudget';
import TrendCars from '../libs/components/homepage/TrendCars';
import TopCars from '../libs/components/homepage/TopCars';
import { Stack } from '@mui/material';
import Advertisement from '../libs/components/homepage/Advertisement';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Home: NextPage = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return (
			<Stack className={'home-page'}>
				<BrowseByBudget />
				<TrendCars />
				<TopAgents />
				<RecentlyAddedCars />
				<PopularCars />
				<Advertisement />
				<TopCars />
				<Events />
				<CommunityBoards />
			</Stack>
		);
	} else {
		return (
			<Stack className={'home-page'}>
				<BrowseByBudget />
				<TrendCars />
				<TopAgents />
				<RecentlyAddedCars />
				<PopularCars />
				<Advertisement />
				<TopCars />
				<Events />
				<CommunityBoards />
			</Stack>
		);
	}
};

export default withLayoutMain(Home);
