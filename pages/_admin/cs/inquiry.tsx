import React, { useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, InputAdornment, Stack } from '@mui/material';
import { List, ListItem } from '@mui/material';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { TabContext } from '@mui/lab';
import OutlinedInput from '@mui/material/OutlinedInput';
import TablePagination from '@mui/material/TablePagination';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { InquiryList } from '../../../libs/components/admin/cs/InquiryList';

const InquiryArticles: NextPage = (props: any) => {
	const [anchorEl, setAnchorEl] = useState<[] | HTMLElement[]>([]);

	/** APOLLO REQUESTS **/
	/** LIFECYCLES **/
	/** HANDLERS **/

	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				1:1 Inquiry Management
			</Typography>
			<Box component={'div'} className={'table-wrap'}>
				<Box component={'div'} sx={{ width: '100%', typography: 'body1' }}>
					<TabContext value={'value'}>
						<Box component={'div'}>
							<List className={'tab-menu'}>
								<ListItem
									// onClick={(e) => handleTabChange(e, 'all')}
									value="all"
									className={'all' === 'all' ? 'li on' : 'li'}
								>
									All (0)
								</ListItem>
								<ListItem
									// onClick={(e) => handleTabChange(e, 'active')}
									value="active"
									className={'all' === 'all' ? 'li on' : 'li'}
								>
									Active (0)
								</ListItem>
								<ListItem
									// onClick={(e) => handleTabChange(e, 'blocked')}
									value="blocked"
									className={'all' === 'all' ? 'li on' : 'li'}
								>
									Blocked (0)
								</ListItem>
								<ListItem
									// onClick={(e) => handleTabChange(e, 'deleted')}
									value="deleted"
									className={'all' === 'all' ? 'li on' : 'li'}
								>
									Deleted (0)
								</ListItem>
							</List>
							<Divider />
							<Stack className={'search-area'} sx={{ m: '24px' }}>
								<Select sx={{ width: '160px', mr: '20px' }} value={'searchCategory'}>
									<MenuItem value={'mb_nick'}>mb_nick</MenuItem>
									<MenuItem value={'mb_id'}>mb_id</MenuItem>
								</Select>

								<OutlinedInput
									value={'searchInput'}
									// onChange={(e) => handleInput(e.target.value)}
									sx={{ width: '100%' }}
									className={'search'}
									placeholder="Search user name"
									onKeyDown={(event) => {
										// if (event.key == 'Enter') searchTargetHandler().then();
									}}
									endAdornment={
										<>
											{true && <CancelRoundedIcon onClick={() => {}} />}
											<InputAdornment position="end" onClick={() => {}}>
												<img src="/img/icons/search_icon.png" alt={'searchIcon'} />
											</InputAdornment>
										</>
									}
								/>
							</Stack>
							<Divider />
						</Box>
						<InquiryList
							// dense={dense}
							// membersData={membersData}
							// searchMembers={searchMembers}
							anchorEl={anchorEl}
							// handleMenuIconClick={handleMenuIconClick}
							// handleMenuIconClose={handleMenuIconClose}
							// generateMentorTypeHandle={generateMentorTypeHandle}
						/>

						<TablePagination
							rowsPerPageOptions={[20, 40, 60]}
							component="div"
							count={4}
							rowsPerPage={10}
							page={1}
							onPageChange={() => {}}
							onRowsPerPageChange={() => {}}
						/>
					</TabContext>
				</Box>
			</Box>
		</Box>
	);
};

export default withAdminLayout(InquiryArticles);
