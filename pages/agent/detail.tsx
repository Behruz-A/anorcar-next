import React, { useEffect, useRef, useState } from 'react';
import { GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Alert,
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	Pagination,
	Skeleton,
	Tab,
	Tabs,
	TextField,
} from '@mui/material';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import CarCard from '../../libs/components/car/CarCard';
import ReviewCard from '../../libs/components/agent/ReviewCard';
import { Member } from '../../libs/types/member/member';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Cars } from '../../libs/types/car/car';
import { CarsInquiry } from '../../libs/types/car/car.input';
import { Comments } from '../../libs/types/comment/comment';
import { CommentsInquiry } from '../../libs/types/comment/comment.input';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { Direction } from '../../libs/enums/common.enum';
import { userVar } from '../../apollo/store';
import { GET_CARS, GET_COMMENTS, GET_MEMBER } from '../../apollo/user/query';
import { CREATE_COMMENT, LIKE_TARGET_CAR, LIKE_TARGET_MEMBER } from '../../apollo/user/mutation';
import { imageUrl } from '../../libs/config';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) },
});

type ProfileTab = 'listings' | 'about' | 'contact';
const AgentProfile = ({ agent, refresh }: { agent: Member; refresh: () => Promise<unknown> }) => {
	const { t, i18n } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [tab, setTab] = useState<ProfileTab>('listings');
	const [page, setPage] = useState(1);
	const [commentPage, setCommentPage] = useState(1);
	const [commentText, setCommentText] = useState('');
	const [commentPending, setCommentPending] = useState(false);
	const [likePending, setLikePending] = useState(false);
	const [failedImage, setFailedImage] = useState<string | null>(null);
	const [notice, setNotice] = useState('');
	const [shareUrl, setShareUrl] = useState('');
	const [contactFocus, setContactFocus] = useState(false);
	const contactHeading = useRef<HTMLHeadingElement>(null);
	const carsInput: CarsInquiry = {
		page,
		limit: 4,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: { memberId: agent._id },
	};
	const commentsInput: CommentsInquiry = {
		page: commentPage,
		limit: 5,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: { commentRefId: agent._id },
	};
	const cars = useQuery<{ getCars: Cars }>(GET_CARS, {
		variables: { input: carsInput },
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const comments = useQuery<{ getComments: Comments }>(GET_COMMENTS, {
		variables: { input: commentsInput },
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const [likeMember] = useMutation(LIKE_TARGET_MEMBER);
	const [likeCar] = useMutation(LIKE_TARGET_CAR);
	const [createComment] = useMutation(CREATE_COMMENT);
	const name = agent.memberFullName?.trim() || agent.memberNick;
	const portrait = agent.memberImage ? imageUrl(agent.memberImage) : '';
	const fallback = !portrait || failedImage === portrait;
	const liked = Boolean(agent.meLiked?.[0]?.myFavorite);
	const carTotal = cars.data?.getCars.metaCounter?.[0]?.total ?? 0;
	const commentTotal = comments.data?.getComments.metaCounter?.[0]?.total ?? 0;
	const phone = agent.memberPhone?.trim() ?? '';
	const phoneHref = phone.replace(/[^\d+]/g, '');
	const memberDate = new Date(agent.createdAt);
	const joined = Number.isNaN(memberDate.getTime())
		? ''
		: new Intl.DateTimeFormat(i18n.language === 'kr' ? 'ko' : i18n.language, { month: 'long', year: 'numeric' }).format(
				memberDate,
		  );
	const allCarsHref = { pathname: '/car', query: { input: JSON.stringify({ ...carsInput, page: 1, limit: 9 }) } };
	useEffect(() => {
		if (tab !== 'contact' || !contactFocus) return;
		const frame = requestAnimationFrame(() => {
			const element = contactHeading.current;
			if (element) {
				const navHeight = document.querySelector('#top')?.getBoundingClientRect().height ?? 0;
				window.scrollTo({
					top: element.getBoundingClientRect().top + window.scrollY - navHeight - 24,
					behavior: 'auto',
				});
				element.focus({ preventScroll: true });
			}
			setContactFocus(false);
		});
		return () => cancelAnimationFrame(frame);
	}, [contactFocus, tab]);
	const toggleLike = async () => {
		if (likePending) return;
		if (!user._id) {
			await sweetMixinErrorAlert(t('Please login first!'));
			return;
		}
		setLikePending(true);
		try {
			await likeMember({ variables: { input: agent._id } });
			await refresh();
		} catch (error: unknown) {
			await sweetMixinErrorAlert(error instanceof Error ? error.message : t('Something went wrong!'));
		} finally {
			setLikePending(false);
		}
	};
	const likeCarHandler = async (viewer: { _id: string }, id: string) => {
		try {
			if (!viewer._id) throw new Error(t('Please login first!'));
			await likeCar({ variables: { input: id } });
			await cars.refetch({ input: carsInput });
		} catch (error: unknown) {
			await sweetMixinErrorAlert(error instanceof Error ? error.message : t('Something went wrong!'));
		}
	};
	const share = async () => {
		const url = new URL(window.location.href);
		url.search = new URLSearchParams({ agentId: agent._id }).toString();
		url.hash = '';
		try {
			if (navigator.share) await navigator.share({ title: name, url: url.href });
			else if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(url.href);
				setNotice('Profile link copied');
			} else setShareUrl(url.href);
		} catch (error: unknown) {
			if (!(error instanceof Error && error.name === 'AbortError')) setShareUrl(url.href);
		}
	};
	const submitComment = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const content = commentText.trim();
		if (!user._id || user._id === agent._id || !content || content.length > 100 || commentPending) return;
		setCommentPending(true);
		try {
			await createComment({
				variables: { input: { commentGroup: CommentGroup.MEMBER, commentContent: content, commentRefId: agent._id } },
			});
			setCommentText('');
			setCommentPage(1);
			await comments.refetch({ input: { ...commentsInput, page: 1 } });
			setNotice('Review submitted');
		} catch (error: unknown) {
			await sweetMixinErrorAlert(error instanceof Error ? error.message : t('Something went wrong!'));
		} finally {
			setCommentPending(false);
		}
	};
	return (
		<>
			<nav className="agent-detail-breadcrumbs" aria-label={t('Breadcrumb')}>
				<Link href="/">{t('Home')}</Link>
				<span aria-hidden="true">›</span>
				<Link href="/agent">{t('Agents')}</Link>
				<span aria-hidden="true">›</span>
				<span aria-current="page">{name}</span>
			</nav>
			<div className="agent-profile-overview">
				<div className={`agent-detail-portrait${fallback ? ' agent-detail-avatar' : ''}`}>
					<Image
						src={fallback ? '/img/profile/defaultUser.svg' : portrait}
						alt={name}
						fill
						unoptimized
						sizes="(max-width: 700px) 100vw, 380px"
						onError={() => {
							if (!fallback) setFailedImage(portrait);
						}}
					/>
					<IconButton
						className="agent-portrait-like"
						aria-label={t(liked ? 'Unlike agent' : 'Like agent')}
						aria-pressed={liked}
						disabled={likePending}
						onClick={() => void toggleLike()}
					>
						{liked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
					</IconButton>
				</div>
				<div className="agent-profile-content">
					<div className="agent-profile-heading">
						<div>
							<span className="agent-detail-role">{t('Car Agent')}</span>
							<h1>{name}</h1>
							<span className="agent-detail-nickname">@{agent.memberNick}</span>
						</div>
						<div className="agent-detail-actions">
							<Button
								className="agent-contact-button"
								variant="contained"
								onClick={() => {
									setTab('contact');
									setContactFocus(true);
								}}
							>
								{t('Contact Agent')}
							</Button>
							<Button
								className="agent-like-button"
								aria-pressed={liked}
								disabled={likePending}
								startIcon={liked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
								onClick={() => void toggleLike()}
							>
								{t(liked ? 'Liked' : 'Like')}
							</Button>
							<IconButton className="agent-share-button" aria-label={t('Share profile')} onClick={() => void share()}>
								<ShareRoundedIcon />
							</IconButton>
						</div>
					</div>
					<div className="agent-detail-location">
						<LocationOnRoundedIcon />
						<span>{agent.memberAddress?.trim() || t('Location not provided')}</span>
					</div>
					<p className="agent-profile-bio">{agent.memberDesc?.trim() || t('No description provided')}</p>
					<div className="agent-profile-stats">
						<div>
							<DirectionsCarRoundedIcon />
							<span>
								<strong>{cars.loading || cars.error ? '—' : carTotal}</strong>
								<span>{t('Cars Listed')}</span>
							</span>
						</div>
						<div>
							<PeopleAltRoundedIcon />
							<span>
								<strong>{agent.memberFollowers}</strong>
								<span>{t('Followers')}</span>
							</span>
						</div>
						<div>
							<VisibilityRoundedIcon />
							<span>
								<strong>{agent.memberViews}</strong>
								<span>{t('Profile views')}</span>
							</span>
						</div>
					</div>
				</div>
			</div>
			{notice && (
				<Alert className="agent-detail-notice" severity="success" onClose={() => setNotice('')}>
					{t(notice)}
				</Alert>
			)}
			<Tabs
				className="agent-detail-tabs"
				value={tab}
				onChange={(_, value: ProfileTab) => setTab(value)}
				aria-label={t('Agent information')}
				variant="scrollable"
				scrollButtons="auto"
			>
				{(['listings', 'about', 'contact'] as const).map((value, index) => (
					<Tab
						key={value}
						value={value}
						label={t(['Listings', 'About', 'Contact'][index])}
						id={`agent-tab-${value}`}
						aria-controls={`agent-panel-${value}`}
					/>
				))}
			</Tabs>
			<section
				className="agent-detail-panel"
				role="tabpanel"
				id="agent-panel-listings"
				aria-labelledby="agent-tab-listings"
				hidden={tab !== 'listings'}
				tabIndex={0}
			>
				<div className="agent-listings-heading">
					<div>
						<h2>{t('Cars by agent', { name })}</h2>
						<p>{cars.loading ? t('Updating cars') : cars.error ? '' : t('Cars available', { count: carTotal })}</p>
					</div>
					<Link className="agent-view-all" href={allCarsHref}>
						{t('View All')}
					</Link>
				</div>
				<div className="agent-detail-cars" aria-busy={cars.loading}>
					{cars.loading ? (
						Array.from({ length: 4 }, (_, index) => (
							<div className="agent-car-skeleton" key={index}>
								<Skeleton variant="rectangular" height={190} />
								<Skeleton height={32} />
								<Skeleton height={80} />
							</div>
						))
					) : cars.error ? (
						<Alert severity="error" action={<Button onClick={() => void cars.refetch()}>{t('Retry')}</Button>}>
							{t('Cars could not be loaded')}
						</Alert>
					) : cars.data?.getCars.list.length ? (
						cars.data.getCars.list.map((car) => (
							<CarCard browse car={car} key={car._id} likeCarHandler={likeCarHandler} />
						))
					) : (
						<div className="agent-detail-empty">
							<DirectionsCarRoundedIcon />
							<h3>{t('No active cars from this agent')}</h3>
							<Link href="/car">{t('Browse all cars')}</Link>
						</div>
					)}
				</div>
				{!cars.loading && !cars.error && carTotal > 4 && (
					<Pagination
						className="agent-detail-pagination"
						page={page}
						count={Math.ceil(carTotal / 4)}
						onChange={(_, value) => setPage(value)}
					/>
				)}
			</section>
			<section
				className="agent-detail-panel agent-about-panel"
				role="tabpanel"
				id="agent-panel-about"
				aria-labelledby="agent-tab-about"
				hidden={tab !== 'about'}
				tabIndex={0}
			>
				<h2>{t('About agent', { name })}</h2>
				<p className="agent-about-description">{agent.memberDesc?.trim() || t('No description provided')}</p>
				{joined && <p className="agent-joined">{t('Member since', { date: joined })}</p>}
				<div className="agent-reviews-heading">
					<h2>{t('Reviews')}</h2>
					<span>
						{comments.loading ? '…' : comments.error ? '' : t('Agent reviews count', { count: commentTotal })}
					</span>
				</div>
				<div className="agent-reviews" aria-busy={comments.loading}>
					{comments.loading ? (
						<Skeleton height={120} />
					) : comments.error ? (
						<Alert severity="error" action={<Button onClick={() => void comments.refetch()}>{t('Retry')}</Button>}>
							{t('Reviews could not be loaded')}
						</Alert>
					) : comments.data?.getComments.list.length ? (
						comments.data.getComments.list.map((comment) => <ReviewCard comment={comment} key={comment._id} />)
					) : (
						<p>{t('No reviews yet')}</p>
					)}
				</div>
				{!comments.loading && !comments.error && commentTotal > 5 && (
					<Pagination
						className="agent-detail-pagination"
						page={commentPage}
						count={Math.ceil(commentTotal / 5)}
						onChange={(_, value) => setCommentPage(value)}
					/>
				)}
				<form className="agent-review-form" onSubmit={submitComment}>
					<h3>{t('Leave A Review')}</h3>
					{!user._id ? (
						<p>
							<Link href="/account/join">{t('Login to leave a review')}</Link>
						</p>
					) : user._id === agent._id ? (
						<p>{t('Cannot write a review for yourself')}</p>
					) : null}
					<label htmlFor="agent-review-content">{t('Review')}</label>
					<textarea
						id="agent-review-content"
						maxLength={100}
						value={commentText}
						onChange={(event) => setCommentText(event.target.value)}
						disabled={!user._id || user._id === agent._id || commentPending}
					/>
					<div>
						<span>{commentText.length}/100</span>
						<Button
							type="submit"
							variant="contained"
							disabled={!user._id || user._id === agent._id || !commentText.trim() || commentPending}
						>
							{t(commentPending ? 'Submitting review' : 'Submit Review')}
						</Button>
					</div>
				</form>
			</section>
			<section
				className="agent-detail-panel agent-contact-panel"
				role="tabpanel"
				id="agent-panel-contact"
				aria-labelledby="agent-tab-contact"
				hidden={tab !== 'contact'}
			>
				<h2 ref={contactHeading} tabIndex={-1}>
					{t('Contact Agent')}
				</h2>
				<p>{t('Contact agent directly')}</p>
				<dl>
					<div>
						<dt>{t('Phone')}</dt>
						<dd>
							{phoneHref.length >= 3 ? (
								<a href={`tel:${phoneHref}`}>
									<PhoneRoundedIcon />
									{phone}
								</a>
							) : (
								t('Phone not provided')
							)}
						</dd>
					</div>
					<div>
						<dt>{t('Location')}</dt>
						<dd>{agent.memberAddress?.trim() || t('Location not provided')}</dd>
					</div>
				</dl>
				<Link
					className="agent-member-link"
					href={{ pathname: user._id === agent._id ? '/mypage' : '/member', query: { memberId: agent._id } }}
				>
					{t('View member profile')}
				</Link>
			</section>
			<Dialog
				open={Boolean(shareUrl)}
				onClose={() => setShareUrl('')}
				fullWidth
				maxWidth="sm"
				aria-labelledby="agent-share-title"
			>
				<DialogTitle id="agent-share-title">
					{t('Share profile')}
					<IconButton aria-label={t('Close')} onClick={() => setShareUrl('')} sx={{ float: 'right' }}>
						<CloseRoundedIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<p>{t('Copy this profile link')}</p>
					<TextField
						autoFocus
						fullWidth
						value={shareUrl}
						inputProps={{ readOnly: true, 'aria-label': t('Profile link') }}
						onFocus={(event) => event.target.select()}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
};

const AgentDetail: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [ready, setReady] = useState(false);
	useEffect(() => setReady(true), []);
	const rawId = router.query.agentId;
	const agentId = typeof rawId === 'string' && /^[a-f\d]{24}$/i.test(rawId) ? rawId : '';
	const profile = useQuery<{ getMember: Member }>(GET_MEMBER, {
		variables: { input: agentId },
		skip: !ready || !router.isReady || !agentId,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const agent = profile.data?.getMember;
	const pending = !ready || !router.isReady || (profile.loading && agent?._id !== agentId);
	return (
		<main className="agent-detail-page">
			<div className="agent-detail-container">
				{pending ? (
					<div className="agent-profile-loading" aria-label={t('Loading agents')} aria-busy="true">
						<Skeleton variant="rectangular" height={360} />
						<div>
							<Skeleton height={75} />
							<Skeleton height={120} />
							<Skeleton height={90} />
						</div>
					</div>
				) : !agentId ? (
					<div className="agent-profile-unavailable">
						<h1>{t('Agent profile unavailable')}</h1>
						<p>{t('Choose an agent to view their profile')}</p>
						<Link href="/agent">{t('Browse agents')}</Link>
					</div>
				) : profile.error ? (
					<Alert severity="error" action={<Button onClick={() => void profile.refetch()}>{t('Retry')}</Button>}>
						{t('Agent profile could not be loaded')} <Link href="/agent">{t('Browse agents')}</Link>
					</Alert>
				) : agent?._id === agentId &&
				  agent.memberType === MemberType.AGENT &&
				  agent.memberStatus === MemberStatus.ACTIVE ? (
					<AgentProfile key={agentId} agent={agent} refresh={() => profile.refetch()} />
				) : (
					<div className="agent-profile-unavailable">
						<h1>{t('Agent profile unavailable')}</h1>
						<Link href="/agent">{t('Browse agents')}</Link>
					</div>
				)}
			</div>
		</main>
	);
};
export default withLayoutBasic(AgentDetail);
