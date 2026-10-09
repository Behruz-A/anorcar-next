import { NextPage } from 'next';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import CommunityBoards from '../libs/components/homepage/CommunityBoards';
import CompareCars from '../libs/components/homepage/CompareCars';
import TopAgents from '../libs/components/homepage/TopAgents';
import RecentlyAddedCars from '../libs/components/homepage/RecentlyAddedCars';
import BrowseByBudget from '../libs/components/homepage/BrowseByBudget';
import TrendCars from '../libs/components/homepage/TrendCars';
import { Stack } from '@mui/material';
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
				<CompareCars />
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
				<CompareCars />
				<CommunityBoards />
			</Stack>
		);
	}
};

export default withLayoutMain(Home);
