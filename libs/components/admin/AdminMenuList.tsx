import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';

const AdminMenuList = () => {
	const router = useRouter();
	const agents = router.pathname === '/_admin/users' && router.query.memberType === 'AGENT';
	const items = [
		{
			label: 'Members',
			href: '/_admin/users',
			icon: PeopleOutlineIcon,
			active: router.pathname === '/_admin/users' && !agents,
		},
		{ label: 'Agents', href: '/_admin/users?memberType=AGENT', icon: BadgeOutlinedIcon, active: agents },
		{
			label: 'Cars',
			href: '/_admin/cars',
			icon: DirectionsCarOutlinedIcon,
			active: router.pathname === '/_admin/cars',
		},
		{
			label: 'Brands',
			href: '/_admin/brands',
			icon: LocalOfferOutlinedIcon,
			active: router.pathname === '/_admin/brands',
		},
		{
			label: 'Community',
			href: '/_admin/community',
			icon: ForumOutlinedIcon,
			active: router.pathname === '/_admin/community',
		},
		{ label: 'FAQ', href: '/_admin/cs/faq', icon: HelpOutlineIcon, active: router.pathname === '/_admin/cs/faq' },
		{
			label: 'Inquiries',
			href: '/_admin/cs/inquiry',
			icon: MailOutlineIcon,
			active: router.pathname === '/_admin/cs/inquiry',
		},
		{
			label: 'Notices',
			href: '/_admin/cs/notice',
			icon: CampaignOutlinedIcon,
			active: router.pathname === '/_admin/cs/notice',
		},
	];
	return (
		<List component="nav" className="admin-navigation" aria-label="Admin navigation">
			{items.map((item) => (
				<ListItemButton
					component={Link}
					href={item.href}
					key={item.href}
					selected={item.active}
					aria-current={item.active ? 'page' : undefined}
				>
					<ListItemIcon>
						<item.icon />
					</ListItemIcon>
					<ListItemText primary={item.label} />
				</ListItemButton>
			))}
		</List>
	);
};

export default AdminMenuList;
