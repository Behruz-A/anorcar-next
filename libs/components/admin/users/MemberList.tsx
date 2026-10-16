import React from 'react';
import Link from 'next/link';
import {
	Avatar,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from '@mui/material';
import { Member } from '../../../types/member/member';
import { MemberUpdate } from '../../../types/member/member.update';
import { MemberStatus, MemberType } from '../../../enums/member.enum';
import { imageUrl } from '../../../config';

interface MemberPanelListProps {
	members: Member[];
	pending?: boolean;
	updateMemberHandler: (input: MemberUpdate) => Promise<void>;
}

export const MemberPanelList = ({ members, pending, updateMemberHandler }: MemberPanelListProps) => (
	<TableContainer>
		<Table sx={{ minWidth: 1000 }} aria-label="Members">
			<TableHead>
				<TableRow>
					{['Member', 'Full name', 'Phone', 'Cars', 'Warnings', 'Blocks', 'Joined', 'Type', 'Status'].map((label) => (
						<TableCell key={label}>{label}</TableCell>
					))}
				</TableRow>
			</TableHead>
			<TableBody>
				{members.length === 0 && (
					<TableRow>
						<TableCell colSpan={9} align="center">
							No members found.
						</TableCell>
					</TableRow>
				)}
				{members.map((member) => {
					const joined = new Date(member.createdAt);
					return (
						<TableRow hover key={member._id}>
							<TableCell>
								<Link className="admin-member-name" href={`/member?memberId=${member._id}`}>
									<Avatar
										src={imageUrl(member.memberImage || '/img/profile/defaultUser.svg')}
										alt={member.memberNick}
									/>
									<span>
										<strong>{member.memberNick}</strong>
										<small title={member._id}>#{member._id.slice(-6)}</small>
									</span>
								</Link>
							</TableCell>
							<TableCell>{member.memberFullName || '—'}</TableCell>
							<TableCell>{member.memberPhone || '—'}</TableCell>
							<TableCell>{member.memberCars}</TableCell>
							<TableCell>{member.memberWarnings}</TableCell>
							<TableCell>{member.memberBlocks}</TableCell>
							<TableCell>{Number.isNaN(joined.getTime()) ? '—' : joined.toISOString().slice(0, 10)}</TableCell>
							<TableCell>
								<Select
									size="small"
									className="admin-pill"
									value={member.memberType}
									disabled={pending}
									inputProps={{ 'aria-label': `Type for ${member.memberNick}` }}
									onChange={(e) => {
										if (e.target.value !== member.memberType)
											void updateMemberHandler({ _id: member._id, memberType: e.target.value as MemberType });
									}}
								>
									{Object.values(MemberType).map((type) => (
										<MenuItem key={type} value={type}>
											{type}
										</MenuItem>
									))}
								</Select>
							</TableCell>
							<TableCell>
								<Select
									size="small"
									className={`admin-pill status-${member.memberStatus}`}
									value={member.memberStatus}
									disabled={pending}
									inputProps={{ 'aria-label': `Status for ${member.memberNick}` }}
									onChange={(e) => {
										if (e.target.value !== member.memberStatus)
											void updateMemberHandler({ _id: member._id, memberStatus: e.target.value as MemberStatus });
									}}
								>
									{Object.values(MemberStatus).map((status) => (
										<MenuItem key={status} value={status}>
											{status === MemberStatus.BLOCK
												? 'Blocked'
												: status === MemberStatus.DELETE
												? 'Deleted'
												: 'Active'}
										</MenuItem>
									))}
								</Select>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	</TableContainer>
);
