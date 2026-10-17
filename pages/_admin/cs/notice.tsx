import React from 'react';
import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { NoticeList } from '../../../libs/components/admin/cs/NoticeList';

const AdminNotice = () => (
	<Box className="content">
		<Typography variant="h2">Notices and news</Typography>
		<Typography sx={{ my: 2 }}>News posts are managed through the existing Community controls.</Typography>
		<Button component={Link} href="/_admin/community" variant="outlined" sx={{ mb: 3 }}>
			Manage community posts
		</Button>
		<NoticeList />
	</Box>
);
export default withAdminLayout(AdminNotice);
