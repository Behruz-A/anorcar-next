import { useTranslation } from 'next-i18next';
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
 const { t } = useTranslation('common');
	const device = useDeviceDetect();
	const router = useRouter();
	const [category, setCategory] = useState<string>('cars');
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
  "cars": [
    {
      "id": "cars-0",
      "subject": "How can I search for cars?",
      "content": "Search by brand, model, year, fuel, transmission, condition, location, and price."
    },
    {
      "id": "cars-1",
      "subject": "How can I contact a seller?",
      "content": "Open a car listing to view the seller profile and phone number."
    }
  ],
  "payment": [
    {
      "id": "payment-0",
      "subject": "Does ANORCAR process vehicle payments?",
      "content": "Payment and rental terms are arranged directly with the seller."
    }
  ],
  "buyers": [
    {
      "id": "buyers-0",
      "subject": "How can I save a car?",
      "content": "Sign in and use the heart button to add or remove favorites."
    },
    {
      "id": "buyers-1",
      "subject": "Where can I find recently viewed cars?",
      "content": "Sign in and open Recently visited from your account."
    }
  ],
  "agents": [
    {
      "id": "agents-0",
      "subject": "How can I publish a car?",
      "content": "Register as a seller and open Add car in your account. Choose an active brand and upload photos."
    },
    {
      "id": "agents-1",
      "subject": "How can I manage my inventory?",
      "content": "Open My cars to edit active listings or mark them sold or deleted."
    }
  ],
  "membership": [
    {
      "id": "membership-0",
      "subject": "Which account type should I choose?",
      "content": "Choose User to browse and save cars, or Seller to publish listings."
    }
  ],
  "community": [
    {
      "id": "community-0",
      "subject": "How can I join the community?",
      "content": "Sign in to publish articles, leave comments, and follow members."
    }
  ],
  "other": [
    {
      "id": "other-0",
      "subject": "Where can I get help?",
      "content": "Visit the customer support section for notices and frequently asked questions."
    }
  ]
};

	if (device === 'mobile') {
		return <div>FAQ MOBILE</div>;
	} else {
		return (
			<Stack className={'faq-content'}>
				<Box className={'categories'} component={'div'}>
					<div
						className={category === 'cars' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('cars');
						}}
					>
						Cars
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
						For buyers
					</div>
					<div
						className={category === 'agents' ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler('agents');
						}}
					>
						For sellers
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
							<Accordion expanded={expanded === ele?.id} onChange={handleChange(ele?.id)} key={t(ele?.subject)}>
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
										<Typography> {t(ele?.content)}</Typography>
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
