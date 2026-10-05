import React from 'react';
import { Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Comment } from '../../types/comment/comment';
import { REACT_APP_API_URL } from '../../config';
import Moment from 'react-moment';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';

interface ReviewProps {
	comment: Comment;
}

const Review = (props: ReviewProps) => {
	const { comment } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [value, setValue] = React.useState<number | null>(2);
	const imagePath: string = comment?.memberData?.memberImage
		? `${REACT_APP_API_URL}/${comment?.memberData?.memberImage}`
		: '/img/profile/defaultUser.svg';

	/** HANDLERS **/
	const goMemberPage = (id: string) => {
		if (id === user?._id) router.push('/mypage');
		else router.push(`/member?memberId=${id}`);
	};
	if (device === 'mobile') {
		return <div>REVIEW</div>;
	} else {
		return (
			<Stack className={'review-config'}>
				<Stack className={'review-mb-info'}>
					<Stack className={'img-name-box'}>
						<img src={imagePath} alt="" className={'img-box'} />
						<Stack>
							<Typography className={'name'} onClick={() => goMemberPage(comment?.memberData?._id as string)}>
								{comment.memberData?.memberNick}
							</Typography>
							<Typography className={'date'}>
								<Moment format={'DD MMMM, YYYY'}>{comment.createdAt}</Moment>
							</Typography>
						</Stack>
					</Stack>
				</Stack>
				<Stack className={'desc-box'}>
					<Typography className={'description'}>{comment.commentContent}</Typography>
				</Stack>
			</Stack>
		);
	}
};

export default Review;
