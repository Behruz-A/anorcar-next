import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import { Stack } from '@mui/material';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyCars from '../../libs/components/mypage/MyCars';
import MyFavorites from '../../libs/components/mypage/MyFavorites';
import RecentlyVisited from '../../libs/components/mypage/RecentlyVisited';
import AddCar from '../../libs/components/mypage/AddNewCar';
import MyProfile from '../../libs/components/mypage/MyProfile';
import MyArticles from '../../libs/components/mypage/MyArticles';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar, authReadyVar } from '../../apollo/store';
import MyMenu from '../../libs/components/mypage/MyMenu';
import WriteArticle from '../../libs/components/mypage/WriteArticle';
import MemberFollowers from '../../libs/components/member/MemberFollowers';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import MemberFollowings from '../../libs/components/member/MemberFollowings';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { Messages } from '../../libs/config';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const MyPage: NextPage = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const authReady = useReactiveVar(authReadyVar);
	const router = useRouter();
	const rawCategory = Array.isArray(router.query.category) ? router.query.category[0] : router.query.category;
	const categoryLabels: Record<string, string> = {
		myProfile: 'My Profile',
		myFavorites: 'My Favorites',
		recentlyVisited: 'Recently Visited',
		followers: 'My Followers',
		followings: 'My Followings',
		myArticles: 'My Articles',
		writeArticle: 'Write Article',
		addCar: 'Add car',
		myCars: 'My cars',
	};
	const requestedCategory =
		rawCategory === 'addProperty' ? 'addCar' : rawCategory === 'myProperties' ? 'myCars' : rawCategory;
	const category = requestedCategory && categoryLabels[requestedCategory] ? requestedCategory : 'myProfile';
	useEffect(() => {
		if (!router.isReady) return;
		const query: typeof router.query = { ...router.query, category };
		const carId = router.query.carId || router.query.propertyId;
		if (carId) query.carId = carId;
		else delete query.carId;
		if (rawCategory !== category || router.query.carId === '' || Array.isArray(router.query.category)) {
			void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false });
		}
	}, [router, rawCategory, category]);

	/** APOLLO REQUESTS **/
	const [subscribe] = useMutation(SUBSCRIBE);
	const [unsubscribe] = useMutation(UNSUBSCRIBE);
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

	/** LIFECYCLES **/
	useEffect(() => {
		if (authReady && !user._id) void router.replace('/account/join');
	}, [authReady, user._id, router]);

	/** HANDLERS **/
	const subscribeHandler = async (id: string, refetch: any, query: any) => {
		try {
			console.log('id: ', id);
			if (!id) throw new Error(Messages.error1);
			if (!user._id) throw new Error(Messages.error2);

			await subscribe({
				variables: {
					input: id,
				},
			});

			await sweetTopSmallSuccessAlert('Subscribed!', 800);
			await refetch({ input: query });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const unsubscribeHandler = async (id: string, refetch: any, query: any) => {
		try {
			if (!id) throw new Error(Messages.error1);
			if (!user._id) throw new Error(Messages.error2);

			await unsubscribe({
				variables: {
					input: id,
				},
			});

			await sweetTopSmallSuccessAlert('Unsubscribed!', 800);
			await refetch({ input: query });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const likeMemberHandler = async (id: string, refetch: any, query: any) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);

			await likeTargetMember({
				variables: {
					input: id,
				},
			});

			await sweetTopSmallSuccessAlert('Success!', 800);
			await refetch({ input: query });
		} catch (err: any) {
			console.log('ERROR, likeMemberHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const redirectToMemberPageHandler = async (memberId: string) => {
		try {
			if (memberId === user?._id) await router.push(`/mypage?memberId=${memberId}`);
			else await router.push(`/member?memberId=${memberId}`);
		} catch (error) {
			await sweetErrorHandling(error);
		}
	};

	if (!authReady || !user._id || !router.isReady) return null;
	{
		return (
			<div id="my-page" className="account-page" style={{ position: 'relative' }}>
				<div className="container">
					<header className="account-heading">
						<nav aria-label={t('Breadcrumb')} className="account-breadcrumbs">
							<Link href="/">{t('Home')}</Link>
							<span aria-hidden="true">›</span>
							<Link href="/mypage">{t('My Page')}</Link>
							<span aria-hidden="true">›</span>
							<span aria-current="page">{t(categoryLabels[String(category)] ?? 'My Profile')}</span>
						</nav>
						<h1>{t(category === 'writeArticle' ? 'Write an Article' : 'My Account')}</h1>
						{category === 'writeArticle' && (
							<p>{t('Share your automotive experiences, tips, and stories with the ANORCAR community.')}</p>
						)}
					</header>
					<Stack className={'my-page'}>
						<Stack className={'back-frame'}>
							<Stack className={'left-config'}>
								<MyMenu />
							</Stack>
							<Stack className="main-config">
								<Stack className={'list-config'}>
									{category === 'addCar' && <AddCar />}
									{category === 'myCars' && <MyCars />}
									{category === 'myFavorites' && <MyFavorites />}
									{category === 'recentlyVisited' && <RecentlyVisited />}
									{category === 'myArticles' && <MyArticles />}
									{category === 'writeArticle' && <WriteArticle />}
									{category === 'myProfile' && <MyProfile />}
									{category === 'followers' && (
										<MemberFollowers
											subscribeHandler={subscribeHandler}
											unsubscribeHandler={unsubscribeHandler}
											likeMemberHandler={likeMemberHandler}
											redirectToMemberPageHandler={redirectToMemberPageHandler}
										/>
									)}
									{category === 'followings' && (
										<MemberFollowings
											subscribeHandler={subscribeHandler}
											unsubscribeHandler={unsubscribeHandler}
											likeMemberHandler={likeMemberHandler}
											redirectToMemberPageHandler={redirectToMemberPageHandler}
										/>
									)}
								</Stack>
							</Stack>
						</Stack>
					</Stack>
				</div>
			</div>
		);
	}
};

export default withLayoutBasic(MyPage);
