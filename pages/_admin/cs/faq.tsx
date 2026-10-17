import React, { useState } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { FaqArticlesPanelList } from '../../../libs/components/admin/cs/FaqList';

const FaqArticles = () => {
	const [search, setSearch] = useState('');
	return (
		<Box className="content">
			<Typography variant="h2">Frequently asked questions</Typography>
			<Typography sx={{ my: 2 }}>
				Published Help Center content is read-only. The current API does not support FAQ editing.
			</Typography>
			<TextField
				fullWidth
				label="Search questions"
				value={search}
				onChange={(event) => setSearch(event.target.value)}
				sx={{ mb: 3 }}
			/>
			<FaqArticlesPanelList search={search} />
		</Box>
	);
};
export default withAdminLayout(FaqArticles);
