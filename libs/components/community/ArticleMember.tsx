import React from 'react';
import Link from 'next/link';
import { Avatar } from '@mui/material';
import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../../apollo/store';
import { imageUrl } from '../../config';
import { Member } from '../../types/member/member';

interface ArticleMemberProps {
	member?: Member | null;
	memberId: string;
	date: string;
}
export default function ArticleMember({ member, memberId, date }: ArticleMemberProps) {
	const { t, i18n } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const name = member?.memberFullName?.trim() || member?.memberNick || t('Community member') || 'ANORCAR';
	const parsedDate = new Date(date);
	const dateLabel = Number.isNaN(parsedDate.getTime())
		? ''
		: parsedDate.toLocaleDateString(i18n.language === 'kr' ? 'ko' : i18n.language, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
		  });
	const identity = (
		<>
			<Avatar src={member?.memberImage ? imageUrl(member.memberImage) : undefined} alt="">
				{name.slice(0, 1).toUpperCase()}
			</Avatar>
			<span>{name}</span>
		</>
	);
	return (
		<div className="article-member">
			{member ? (
				<Link href={memberId === user._id ? '/mypage' : { pathname: '/member', query: { memberId } }}>{identity}</Link>
			) : (
				<div className="article-member-fallback">{identity}</div>
			)}
			{dateLabel && <time dateTime={date}>{dateLabel}</time>}
		</div>
	);
}
