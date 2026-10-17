import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { helpQuestions, helpTopics } from '../../cs/helpContent';

export const FaqArticlesPanelList = ({ search = '' }: { search?: string }) => {
	const { t } = useTranslation('common');
	const query = search.trim().toLocaleLowerCase();
	const questions = helpQuestions.filter((question) =>
		[t(question.question), t(question.answer)].join(' ').toLocaleLowerCase().includes(query),
	);
	return (
		<TableContainer>
			<Table aria-label="Published frequently asked questions">
				<TableHead>
					<TableRow>
						<TableCell>Category</TableCell>
						<TableCell>Question</TableCell>
						<TableCell>Answer</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{questions.map((question) => (
						<TableRow key={question.id}>
							<TableCell>
								{t(helpTopics.find((topic) => topic.id === question.category)?.title ?? question.category)}
							</TableCell>
							<TableCell>{t(question.question)}</TableCell>
							<TableCell>{t(question.answer)}</TableCell>
						</TableRow>
					))}
					{questions.length === 0 && (
						<TableRow>
							<TableCell colSpan={3}>No matching questions.</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
};
