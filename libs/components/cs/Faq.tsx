import React, { SyntheticEvent, useState } from 'react';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import { AccordionDetails, Box, Stack, Typography } from '@mui/material';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import { useRouter } from 'next/router';
import { styled } from '@mui/material/styles';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(
	({ theme }) => ({
		border: `1px solid ${theme.palette.divider}`,
		'&:not(:last-child)': {
			borderBottom: 0,
		},
		'&:before': {
			display: 'none',
		},
	}),
);
const AccordionSummary = styled((props: AccordionSummaryProps) => (
	<MuiAccordionSummary expandIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: '1.4rem' }} />} {...props} />
))(({ theme }) => ({
	backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : '#fff',
	'& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
		transform: 'rotate(180deg)',
	},
	'& .MuiAccordionSummary-content': {
		marginLeft: theme.spacing(1),
	},
}));

const Faq = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [category, setCategory] = useState<string>('property');
	const [expanded, setExpanded] = useState<string | false>('panel1');

	/** APOLLO REQUESTS **/
	/** LIFECYCLES **/
	
	/** HANDLERS **/
	const changeCategoryHandler = (category: string) => {
		setCategory(category);
	};

	const handleChange = (panel: string) => (event: SyntheticEvent, newExpanded: boolean) => {
		setExpanded(newExpanded ? panel : false);
	};

	const data: any = {
		property: [
			{
				id: '00f5a45ed8897f8090116a01',
				subject: 'Are the properties displayed on the site reliable?',
				content: 'of course we only have verified properties',
			},
			{
				id: '00f5a45ed8897f8090116a22',
				subject: 'What types of properties do you offer?',
				content: 'We offer single-family homes, condos, townhouses, apartments, and penthouses',
			},
			{
				id: '00f5a45ed8897f8090116a21',
				subject: 'How can I search for properties on your website?',
				content: 'Simply use our search bar to enter location, price range, bedrooms/bathrooms, and property type.',
			},
			{
				id: '00f5a45ed8897f8090116a23',
				subject: 'Do you provide assistance for first-time homebuyers?',
				content: 'Yes, we guide you through the process and help find suitable financing.',
			},
			{
				id: '00f5a45ed8897f8090116a24',
				subject: 'What should I consider when buying a property?',
				content: 'Location, condition, size, amenities, and future development plans.',
			},
			{
				id: '00f5a45ed8897f8090116a25',
				subject: 'How long does the home-buying process typically take?',
				content: 'Usually 3 to 6 days, depending on various factors.',
			},
			{
				id: '00f5a45ed8897f8090116a29',
				subject: 'What happens if I encounter issues with the property after purchase?',
				content: 'We offer post-purchase support to address any concerns promptly.',
			},
			{
				id: '00f5a45ed8897f8090116a28',
				subject: 'Do you offer properties in specific neighborhoods?',
				content: 'Yes, we have listings in various neighborhoods based on your preferences.',
			},
			{
				id: '00f5a45ed8897f8090116a27',
				subject: 'Can I sell my property through your website?',
				content: 'Absolutely, we provide services for selling properties as well.',
			},
			{
				id: '00f5a45ed8897f8090116b99',
				subject: 'What if I need help understanding legal aspects of property purchase?',
				content: 'Our team can provide basic guidance and recommend legal professionals if needed.',
			},
		],
		payment: [
			{
				id: '00f5a45ed8897f8090116a02',
				subject: 'How can I make the payment?',
				content: 'you make the payment through an agent!',
			},
			{
				id: '00f5a45ed8897f8090116a91',
				subject: 'Are there any additional fees for using your services?',
				content: 'No, our services are free for buyers. Sellers pay a commission upon successful sale.',
			},
			{
				id: '00f5a45ed8897f8090116a92',
				subject: 'Is there an option for installment payments?',
				content: 'Yes, we offer installment payment plans for certain properties. Please inquire for more details.',
			},
			{
				id: '00f5a45ed8897f8090116a93',
				subject: 'Is my payment information secure on your website?',
				content:
					'Yes, we use industry-standard encryption technology to ensure the security of your payment information.',
			},
			{
				id: '00f5a45ed8897f8090116a94',
				subject: 'Can I make payments online through your website?',
				content: "Yes, you can securely make payments online through our website's payment portal.",
			},
			{
				id: '00f5a45ed8897f8090116a95',
				subject: "What happens if there's an issue with my payment?",
				content: 'If you encounter any issues with your payment, please contact our support team for assistance.',
			},
			{
				id: '00f5a45ed8897f8090116a96',
				subject: 'Do you offer refunds for payments made?',
				content:
					'Refund policies vary depending on the circumstances. Please refer to our refund policy or contact us for more information.',
			},
			{
				id: '00f5a45ed8897f8090116a97',
				subject: 'Are there any discounts or incentives for early payments?',
				content:
					'We occasionally offer discounts or incentives for early payments. Check our promotions or contact us for current offers.',
			},
			{
				id: '00f5a45ed8897f8090116a99',
				subject: 'How long does it take for payments to be processed?',
				content:
					'Payment processing times vary depending on the payment method used. Typically, credit/debit card payments are processed instantly',
			},
			{
				id: '00f5a45ed8897f8090116a98',
				subject: 'Are there penalties for late payments?',
				content:
					'Late payment penalties may apply depending on the terms of your agreement. Please refer to your contract or contact us for details.',
			},
		],
		buyers: [
			{
				id: '00f5a45ed8897f8090116a03',
				subject: 'What should buyers pay attention to?',
				content: 'Buyers should check and decide whether the property they want to buy or rent is actually suitable!',
			},
			{
				id: '00f5a45ed8897f8090116a85',
				subject: 'How can I determine if a property is within my budget?',
				content:
					'Calculate your budget by considering your income, down payment, and potential mortgage payments. Our agents can assist you within your budget.',
			},
			{
				id: '00f5a45ed8897f8090116a84',
				subject: 'What documents do I need to provide when purchasing a property?',
				content:
					"You'll typically need identification, proof of income, bank statements, and any necessary loan documentation. Our team will guide you through.",
			},
			{
				id: '00f5a45ed8897f8090116a83',
				subject: 'What factors should I consider when choosing a neighborhood?',
				content:
					'Consider factors such as location, safety, schools, amenities, transportation, and future development plans.',
			},
			{
				id: '00f5a45ed8897f8090116a82',
				subject: 'Can I negotiate the price of a property?',
				content:
					'Yes, you can negotiate the price of a property. Our agents will assist you in making competitive offers and negotiating terms with the seller.',
			},
			{
				id: '00f5a45ed8897f8090116a81',
				subject: 'What are some red flags to watch out for when viewing properties?',
				content:
					'Watch out for signs of structural damage, water damage, mold, outdated systems, and undesirable neighborhood conditions.',
			},
			{
				id: '00f5a45ed8897f8090116a80',
				subject: 'Do you provide assistance with property inspections?',
				content:
					'Yes, we can recommend reputable inspectors and accompany you during property inspections to identify any potential issues.',
			},
			{
				id: '00f5a45ed8897f8090116a79',
				subject: 'How long does it typically take to find the right property?',
				content:
					'The timeframe varies depending on your preferences and market conditions. Our agents will work diligently to find the right property as quickly as possible.',
			},
			{
				id: '00f5a45ed8897f8090116a78',
				subject: 'What are the advantages of using a real estate agent when buying a property?',
				content:
					'Real estate agents provide expertise, negotiation skills, and guidance throughout the buying process, ultimately saving you time and hassle.',
			},
			{
				id: '00f5a45ed8897f8090116a77',
				subject: 'What happens if I change my mind about a property after making an offer?',
				content:
					'Depending on the terms of the offer and the stage of the transaction, you may have options to withdraw your offer.',
			},
		],

		agents: [
			{
				id: '00f5a45ed8897f8090116a04',
				subject: 'What do I need to do if I want to become an agent?',
				content:
					'If you really decide to become an agent, you should read our terms and conditions and contact the admin!',
			},
			{
				id: '00f5a45ed8897f8090116a62',
				subject: 'What qualifications do I need to become a real estate agent?',
				content: 'Complete pre-licensing course, pass licensing exam, meet state requirements.',
			},
			{
				id: '00f5a45ed8897f8090116a63',
				subject: 'How do I find clients as a new real estate agent?',
				content: 'Build network, use online/offline marketing, join reputable brokerage.',
			},
			{
				id: '00f5a45ed8897f8090116a64',
				subject: 'What are some effective marketing strategies for selling properties?',
				content: 'Use social media, online platforms, networking events, and direct mail.',
			},
			{
				id: '00f5a45ed8897f8090116a65',
				subject: 'How do I handle negotiations with buyers and sellers?',
				content: 'Develop strong negotiation skills, understand market trends, represent client interests.',
			},
			{
				id: '00f5a45ed8897f8090116a66',
				subject: 'What should I do to stay updated with market trends and changes?',
				content: 'Attend industry events, follow real estate news, participate in training.',
			},
			{
				id: '00f5a45ed8897f8090116a67',
				subject: 'How do I handle difficult clients or situations?',
				content:
					'Approach with professionalism, empathy, and patience. Listen actively, address issues collaboratively.',
			},
			{
				id: '00f5a45ed8897f8090116a68',
				subject: 'What tools and technologies should I utilize as a real estate agent?',
				content: 'Use CRM software, virtual tours, digital marketing tools, and mobile apps.',
			},
			{
				id: '00f5a45ed8897f8090116a69',
				subject: 'How do I ensure compliance with real estate laws and regulations?',
				content: 'Stay updated with laws, attend education courses, consult legal professionals.',
			},
			{
				id: '00f5a45ed8897f8090116a70',
				subject: 'What strategies can I use to grow my real estate business?',
				content: 'Build relationships, provide exceptional service, seek referrals, and continuously improve skills.',
			},
		],
		membership: [
			{
				id: '00f5a45ed8897f8090116a05',
				subject: 'Do you have a membership service on your site?',
				content: 'membership service is not available on our site yet!',
			},
			{
				id: '00f5a45ed8897f8090116a60',
				subject: 'What are the benefits of becoming a member on your website?',
				content: 'We currently do not offer membership benefits, but stay tuned for updates on any future offerings.',
			},
			{
				id: '00f5a45ed8897f8090116a59',
				subject: 'Is there a fee associated with becoming a member?',
				content: 'As membership services are not available, there are no associated fees at this time.',
			},
			{
				id: '00f5a45ed8897f8090116a58',
				subject: 'Will membership provide access to exclusive content or features?',
				content: "We don't currently have membership-exclusive content or features.",
			},
			{
				id: '00f5a45ed8897f8090116a57',
				subject: 'How can I sign up for a membership on your site?',
				content: 'As of now, we do not have a sign-up process for memberships.',
			},
			{
				id: '00f5a45ed8897f8090116a56',
				subject: 'Do members receive discounts on property listings or services?',
				content: 'Membership discounts are not part of our current offerings.',
			},
			{
				id: '00f5a45ed8897f8090116a55',
				subject: 'Are there plans to introduce a membership program in the future?',
				content:
					"While we can't confirm any plans at this time, we're always exploring ways to enhance our services for users.",
			},
			{
				id: '00f5a45ed8897f8090116a54',
				subject: 'What kind of content or benefits can members expect if a membership program is introduced?',
				content: "We're evaluating potential benefits and features, but specifics are not available yet.",
			},
			{
				id: '00f5a45ed8897f8090116a33',
				subject: 'Do you offer a premium membership option on your platform?',
				content: 'Currently, we do not provide a premium membership option.',
			},
			{
				id: '00f5a45ed8897f8090116a32',
				subject: 'Will membership grant access to exclusive deals or discounts?',
				content: 'Membership perks, including deals or discounts, are not available at this time.',
			},
		],
		community: [
			{
				id: '00f5a45ed8897f8090116a06',
				subject: 'What should I do if there is abusive or criminal behavior in the community section?',
				content: 'If you encounter this situation, please report it immediately or contact the admin!',
			},
			{
				id: '00f5a45ed8897f8090116a44',
				subject: 'How can I participate in the community section of your website?',
				content: 'Create an account and engage in discussions.',
			},
			{
				id: '00f5a45ed8897f8090116a45',
				subject: 'Are there guidelines for posting?',
				content: 'Yes, follow our community guidelines.',
			},
			{
				id: '00f5a45ed8897f8090116a46',
				subject: 'What should I do if I encounter spam or irrelevant posts?',
				content: 'Report them to the admin.',
			},
			{
				id: '00f5a45ed8897f8090116a47',
				subject: 'Can I connect with other members outside of the community section?',
				content: 'Currently, no.',
			},
			{
				id: '00f5a45ed8897f8090116a48',
				subject: 'Can I share personal experiences or recommendations?',
				content: 'Yes, if relevant you can share personal experiences and recommendations.',
			},
			{
				id: '00f5a45ed8897f8090116a49',
				subject: 'How can I ensure privacy?',
				content: 'Avoid sharing sensitive information.',
			},
			{
				id: '00f5a45ed8897f8090116a50',
				subject: 'How can I contribute positively?',
				content: 'Respect others and engage constructively.',
			},
			{
				id: '00f5a45ed8897f8090116a51',
				subject: 'What if I notice misinformation?',
				content: 'Provide correct information or report to the admin.',
			},
			{
				id: '00f5a45ed8897f8090116a52',
				subject: 'Are there moderators?',
				content: 'Yes, we have moderators.',
			},
		],
		other: [
			{
				id: '00f5a45ed8897f8090116a40',
				subject: 'Who should I contact if I want to buy your site?',
				content: 'We have no plans to sell the site at this time!',
			},
			{
				id: '00f5a45ed8897f8090116a39',
				subject: 'Can I advertise my services on your website?',
				content: 'We currently do not offer advertising opportunities on our site.',
			},
			{
				id: '00f5a45ed8897f8090116a38',
				subject: 'Are there sponsorship opportunities available on your platform?',
				content: 'At this time, we do not have sponsorship opportunities.',
			},
			{
				id: '00f5a45ed8897f8090116a36',
				subject: 'Can I contribute guest posts or articles to your website?',
				content: "We're not accepting guest posts or articles at the moment.",
			},
			{
				id: '00f5a45ed8897f8090116a35',
				subject: 'Is there a referral program for recommending your website to others?',
				content: "We don't have a referral program in place currently.",
			},
			{
				id: '00f5a45ed8897f8090116a34',
				subject: 'Do you offer affiliate partnerships for promoting your services?',
				content: 'Affiliate partnerships are not available at this time.',
			},
			{
				id: '00f5a45ed8897f8090116a33',
				subject: 'Can I purchase merchandise related to your website?',
				content: "We don't have merchandise available for purchase.",
			},
			{
				id: '00f5a45ed8897f8090116a32',
				subject: 'Are there any job openings or opportunities to work with your team?',
				content: 'Currently, we do not have any job openings or opportunities available.',
			},
			{
				id: '00f5a45ed8897f8090116a31',
				subject: 'Do you host events or webinars related to real estate?',
				content: "We're not hosting events or webinars at this time.",
			},
			{
				id: '00f5a45ed8897f8090116a30',
				subject: 'Can I request custom features or functionalities for your website?',
				content: "We're not accepting requests for custom features or functionalities.",
			},
		],
	};

	if (device === 'mobile') {
		return <div>FAQ MOBILE</div>;
	} else {
		return (
			<Stack className={'faq-content'}>
				<Box className={'categories'} component={'div'}>
					<div
						className={category === 'property' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('property');
						}}
					>
						Property
					</div>
					<div
						className={category === 'payment' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('payment');
						}}
					>
						Payment
					</div>
					<div
						className={category === 'buyers' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('buyers');
						}}
					>
						Foy Buyers
					</div>
					<div
						className={category === 'agents' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('agents');
						}}
					>
						For Agents
					</div>
					<div
						className={category === 'membership' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('membership');
						}}
					>
						Membership
					</div>
					<div
						className={category === 'community' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('community');
						}}
					>
						Community
					</div>
					<div
						className={category === 'other' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('other');
						}}
					>
						Other
					</div>
				</Box>
				<Box className={'wrap'} component={'div'}>
					{data[category] &&
						data[category].map((ele: any) => (
							<Accordion expanded={expanded === ele?.id} onChange={handleChange(ele?.id)} key={ele?.subject}>
								<AccordionSummary id="panel1d-header" className="question" aria-controls="panel1d-content">
									<Typography className="badge" variant={'h4'}>
										Q
									</Typography>
									<Typography> {ele?.subject}</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Stack className={'answer flex-box'}>
										<Typography className="badge" variant={'h4'} color={'primary'}>
											A
										</Typography>
										<Typography> {ele?.content}</Typography>
									</Stack>
								</AccordionDetails>
							</Accordion>
						))}
				</Box>
			</Stack>
		);
	}
};

export default Faq;
