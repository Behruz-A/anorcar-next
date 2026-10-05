import React from 'react';
import { useRouter } from 'next/router';
import { Stack } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Member } from '../../types/member/member';
import { REACT_APP_API_URL } from '../../config';

interface TopAgentProps {
	agent: Member;
}
const TopAgentCard = (props: TopAgentProps) => {
	const { agent } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const agentImage = agent?.memberImage
		? `${REACT_APP_API_URL}/${agent.memberImage}`
		: '/img/profile/defaultUser.svg';

	/** HANDLERS **/

	if (device === 'mobile') {
		return (
			<Stack className="top-agent-card">
				<img src={agentImage} alt="" />

				<strong>{agent?.memberNick}</strong>
				<span>{agent?.memberType}</span>
			</Stack>
		);
	} else {
		return (
			<Stack className="top-agent-card">
				<img src={agentImage} alt="" />

				<strong>{agent?.memberNick}</strong>
				<span>{agent?.memberType}</span>
			</Stack>
		);
	}
};

export default TopAgentCard;
