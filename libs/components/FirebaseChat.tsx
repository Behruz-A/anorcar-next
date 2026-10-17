import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { CHAT_AGENTS } from '../../apollo/user/firebaseChat';
import { useFirebaseChat } from '../hooks/useFirebaseChat';
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function FirebaseChat({
	open,
	agentId,
	carContext = null,
	contactRequest = 0,
}: {
	open: boolean;
	agentId: string;
	carContext?: { id: string; title: string } | null;
	contactRequest?: number;
}) {
	const chat = useFirebaseChat(open);
	const { select, startConversation } = chat;
	const router = useRouter();
	const { t: translate } = useTranslation('common');
	const t = (key: string) => translate(key, { lng: router.locale ?? 'en' });
	const [input, setInput] = useState('');
	const [agentPage, setAgentPage] = useState(1);
	const [chosenAgent, setChosenAgent] = useState('');
	const content = useRef<HTMLDivElement>(null);
	const nearBottom = useRef(true);
	const anchor = useRef<{ height: number; top: number } | null>(null);
	const initiated = useRef('');
	const composeVersion = useRef(0);
	const customer = chat.allowed && chat.isCustomer && !chat.selected;
	const contactNotice =
		agentId && chat.uid && !chat.selected
			? chat.uid === agentId
				? 'This is your listing. You cannot message yourself.'
				: !chat.isCustomer
				? 'Only buyer accounts can start seller chats. Agents can reply to existing customer conversations.'
				: !chat.allowed
				? 'Chat is unavailable for this account.'
				: ''
			: '';
	const {
		data,
		loading: agentsLoading,
		error: agentsError,
		refetch,
	} = useQuery(CHAT_AGENTS, {
		variables: { input: { page: agentPage, limit: 20, sort: 'memberRank', direction: 'DESC', search: {} } },
		skip: !open || !customer,
	});
	useEffect(() => {
		++composeVersion.current;
		setInput('');
		initiated.current = '';
		setChosenAgent('');
	}, [chat.uid]);
	useEffect(() => {
		++composeVersion.current;
		setInput('');
		nearBottom.current = true;
		anchor.current = null;
	}, [chat.selected]);
	useEffect(() => {
		if (!agentId || !chat.ready) {
			initiated.current = '';
			return;
		}
		if (!chat.isCustomer || chat.uid === agentId) {
			select('');
			initiated.current = '';
			return;
		}
		const request = `${agentId}:${contactRequest}`;
		if (initiated.current !== request) {
			initiated.current = request;
			select('');
			void startConversation(agentId);
		}
	}, [agentId, chat.ready, contactRequest, chat.isCustomer, chat.uid, select, startConversation]); // Backend checks the current role and agent status.
	useBrowserLayoutEffect(() => {
		const element = content.current;
		if (!element) return;
		if (anchor.current && !chat.olderLoading) {
			element.scrollTop = anchor.current.top + element.scrollHeight - anchor.current.height;
			anchor.current = null;
		} else if (!anchor.current && nearBottom.current) element.scrollTop = element.scrollHeight;
	}, [chat.messages, chat.olderLoading]);
	const submit = async () => {
		const text = input;
		const version = composeVersion.current;
		if ((await chat.send(text)) && version === composeVersion.current) {
			nearBottom.current = true;
			setInput((previous) => (previous === text ? '' : previous));
		}
	};
	return (
		<>
			{carContext && (!chat.selected || chat.selected === `${chat.uid}_${agentId}`) && (
				<div className="private-chat-car-context">
					<span>{t('About this car')}</span>
					<strong>{carContext.title}</strong>
				</div>
			)}
			<div className="private-chat-controls">
				{!chat.allowed ? (
					chat.uid ? (
						<p role="status">{t('Chat is unavailable for this account.')}</p>
					) : (
						<Link href={{ pathname: '/account/join', query: { referrer: router.asPath } }}>
							{t('Sign in to chat with an agent')}
						</Link>
					)
				) : (
					<>
						<select
							aria-label={t('Conversations')}
							value={chat.selected}
							onChange={(event) => chat.select(event.target.value)}
						>
							<option value="">{t('Conversations')}</option>
							{chat.threads.map((thread) => (
								<option key={thread.id} value={thread.id}>
									{thread.otherMemberId} {thread.preview ? `— ${thread.preview.slice(0, 45)}` : ''}
								</option>
							))}
						</select>
						<span role="status">
							{t(
								chat.indexLoading
									? 'Loading conversations'
									: chat.ready
									? chat.online
										? 'Connected'
										: 'Reconnecting'
									: 'Connecting',
							)}
						</span>
					</>
				)}
			</div>
			{contactNotice && (
				<div className="private-chat-car-context" role="status">
					<strong>{t(contactNotice)}</strong>
				</div>
			)}
			{chat.error && (
				<div className="private-chat-error" role="alert">
					{t(chat.error)}{' '}
					<button type="button" onClick={chat.retry}>
						{t('Retry')}
					</button>
				</div>
			)}
			<div
				className="chat-content"
				ref={content}
				onScroll={() => {
					const element = content.current;
					if (element) nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 60;
				}}
			>
				<div className="chat-main">
					{!chat.selected && chat.allowed && <p>{t('Select a conversation or contact an agent.')}</p>}
					{!chat.selected && customer && (
						<>
							{agentsLoading && <p role="status">{t('Loading agents')}</p>}
							{agentsError && (
								<button type="button" onClick={() => void refetch()}>
									{t('Retry')}
								</button>
							)}
							<select
								aria-label={t('Select agent')}
								value={chosenAgent}
								onChange={(event) => setChosenAgent(event.target.value)}
							>
								<option value="">{t('Select agent')}</option>
								{data?.getAgents.list.map((agent: { _id: string; memberNick: string }) => (
									<option key={agent._id} value={agent._id}>
										{agent.memberNick}
									</option>
								))}
							</select>
							<button
								type="button"
								disabled={!chat.ready || !chosenAgent}
								onClick={() => void chat.startConversation(chosenAgent)}
							>
								{t('Contact Agent')}
							</button>
							<div className="private-agent-pages">
								<button
									type="button"
									disabled={agentPage === 1}
									onClick={() => {
										setAgentPage((value) => value - 1);
										setChosenAgent('');
									}}
								>
									{t('Previous')}
								</button>
								<button
									type="button"
									disabled={agentPage * 20 >= (data?.getAgents.metaCounter[0]?.total ?? 0)}
									onClick={() => {
										setAgentPage((value) => value + 1);
										setChosenAgent('');
									}}
								>
									{t('Next')}
								</button>
							</div>
						</>
					)}
					{chat.loading && <p role="status">{t('Loading messages')}</p>}
					{chat.selected && !chat.loading && !chat.messages.length && <p>{t('No messages yet')}</p>}
					{chat.hasOlder && (
						<button
							type="button"
							disabled={chat.olderLoading || !chat.online}
							onClick={() => {
								if (content.current)
									anchor.current = { height: content.current.scrollHeight, top: content.current.scrollTop };
								void chat.loadOlder();
							}}
						>
							{t(chat.olderLoading ? 'Loading messages' : 'Load older messages')}
						</button>
					)}
					{chat.messages.map((message) => {
						const own = message.senderId === chat.uid;
						const name = own ? t('You') : message.senderId;
						return (
							<div key={message.id} className={`live-message-row ${own ? 'live-message-own' : ''}`}>
								{!own && <Avatar alt={name} src="/img/profile/defaultUser.svg" />}
								<div className="live-message-body">
									<span className="live-message-name">{name}</span>
									<div className={own ? 'msg-right' : 'msg-left'}>{message.text}</div>
									<time className="live-message-name" dateTime={new Date(message.createdAt).toISOString()}>
										{new Date(message.createdAt).toLocaleString(router.locale)}
									</time>
								</div>
							</div>
						);
					})}
				</div>
			</div>
			<div className="chat-bott">
				<input
					className="msg-input"
					aria-label={t('Live Chat message')}
					placeholder={t('Type message')}
					maxLength={2000}
					value={input}
					disabled={!chat.ready || !chat.selected}
					onChange={(event) => setInput(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
							event.preventDefault();
							void submit();
						}
					}}
				/>
				<button
					type="button"
					className="send-msg-btn"
					aria-label={t('Send Live Chat message')}
					disabled={!chat.ready || !chat.online || !chat.selected || chat.sending || !input.trim()}
					onClick={() => void submit()}
				>
					<SendIcon style={{ color: '#fff' }} />
				</button>
			</div>
		</>
	);
}
