import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, Box, Stack } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import MarkChatUnreadIcon from '@mui/icons-material/MarkChatUnread';
import { useRouter } from 'next/router';
import ScrollableFeed from 'react-scrollable-feed';
import { useReactiveVar } from '@apollo/client';
import { socketVar, userVar } from '../../apollo/store';
import { Member } from '../types/member/member';
import { Messages, imageUrl } from '../config';
import { sweetErrorAlert } from '../sweetAlert';
import { getValidJwtToken } from '../auth';
import { useTranslation } from 'next-i18next';
import CloseIcon from '@mui/icons-material/Close';
import FirebaseChat from './FirebaseChat';

interface MessagePayload {
	event: string;
	text: string;
	memberData: Member | null;
}

const Chat = ({
	open: controlledOpen,
	onOpenChange,
	hideLauncher = false,
}: { open?: boolean; onOpenChange?: (open: boolean) => void; hideLauncher?: boolean } = {}) => {
	const { t: translate } = useTranslation('common');
	const t = (key: string) => translate(key, { lng: router.locale ?? 'en' });
	const chatContentRef = useRef<HTMLDivElement>(null);
	const [messagesList, setMessagesList] = useState<MessagePayload[]>([]);
	const [onlineUsers, setOnlineUsers] = useState<number | null>(null);

	const [messageInput, setMessageInput] = useState<string>('');
	const [localOpen, setOpen] = useState(false);
	const open = controlledOpen ?? localOpen;
	const [openButton, setOpenButton] = useState(false);
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const socket = useReactiveVar(socketVar); // loyihani istalgan. joyida socketni ishlastsa buladi
	const [chatMode, setChatMode] = useState<'private' | 'community'>('private');
	const [agentId, setAgentId] = useState('');
	const [carContext, setCarContext] = useState<{ id: string; title: string } | null>(null);
	const [contactRequest, setContactRequest] = useState(0);
	useEffect(() => {
		const contact = (event: Event) => {
			const id = (event as CustomEvent).detail?.agentId;
			if (typeof id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(id)) return;
			setChatMode('private');
			setAgentId(id.toLowerCase());
			const car = (event as CustomEvent).detail?.car;
			setCarContext(
				car && typeof car.id === 'string' && /^[a-fA-F0-9]{24}$/.test(car.id) && typeof car.title === 'string'
					? { id: car.id, title: car.title.slice(0, 100) }
					: null,
			);
			setContactRequest((previous) => previous + 1);
			if (!onOpenChange) setOpen(true);
		};
		window.addEventListener('anorcar:contact-agent', contact);
		return () => window.removeEventListener('anorcar:contact-agent', contact);
	}, [onOpenChange]);
	useEffect(() => {
		setAgentId('');
		setCarContext(null);
	}, [user._id]);

	/** LIFECYCLES **/

	useEffect(() => {
		setOnlineUsers(null);
		if (!socket) return;
		const receiveMessage = (msg: MessageEvent) => {
			let data: {
				event?: string;
				totalClients?: number;
				list?: MessagePayload[];
				text?: string;
				memberData?: Member | null;
			};
			try {
				data = JSON.parse(msg.data);
			} catch {
				return;
			}
			switch (data?.event) {
				case 'info':
					if (typeof data.totalClients === 'number' && Number.isInteger(data.totalClients) && data.totalClients >= 0)
						setOnlineUsers(data.totalClients);
					break;
				case 'getMessages':
					if (Array.isArray(data.list)) setMessagesList(data.list);
					break;
				case 'message':
					setMessagesList((previous) => [...previous, data as MessagePayload]);
					break;
			}
		};
		socket.addEventListener('message', receiveMessage);
		return () => socket.removeEventListener('message', receiveMessage);
	}, [socket]);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setOpenButton(true);
		}, 100);
		return () => clearTimeout(timeoutId);
	}, []);

	useEffect(() => {
		setOpenButton(false);
	}, [router.pathname]);

	/** HANDLERS **/
	const handleOpenChat = () => {
		if (onOpenChange) onOpenChange(!open);
		else setOpen((prevState) => !prevState);
	};

	const getInputMessageHandler = useCallback(
		(e: any) => {
			const text = e.target.value;
			setMessageInput(text);
		},
		[],
	);

	const getKeyHandler = (e: any) => {
		try {
			if (e.key == 'Enter') {
				onClickHandler();
			}
		} catch (err: any) {

		}
	};

	const onClickHandler = async () => {
		if (!messageInput) sweetErrorAlert(Messages.error4);
		else {
			try {
				if (user._id) await getValidJwtToken();
				const currentSocket = socketVar();
				if (currentSocket.readyState === WebSocket.CONNECTING) {
					await new Promise<void>((resolve, reject) => {
						const timer = setTimeout(() => reject(new Error('Chat connection unavailable')), 10000);
						currentSocket.addEventListener(
							'open',
							() => {
								clearTimeout(timer);
								resolve();
							},
							{ once: true },
						);
						currentSocket.addEventListener(
							'error',
							() => {
								clearTimeout(timer);
								reject(new Error('Chat connection unavailable'));
							},
							{ once: true },
						);
					});
				}
				currentSocket.send(JSON.stringify({ event: 'message', data: messageInput }));
				setMessageInput('');
			} catch {
				/* Preserve the message for retry if authentication/network is unavailable. */
			}
		}
	};

	return (
		<Stack className="chatting">
			{openButton && !hideLauncher ? (
				<button className="chat-button" onClick={handleOpenChat}>
					{open ? <CloseFullscreenIcon /> : <MarkChatUnreadIcon />}
				</button>
			) : null}
			<Stack
				id="anorcar-live-panel"
				role="dialog"
				aria-label={t('Live Chat')}
				aria-hidden={!open}
				className={`chat-frame ${open ? 'open' : ''}`}
			>
				<Box className={'chat-top'} component={'div'}>
					<span className="live-chat-icon">
						<MarkChatUnreadIcon />
					</span>
					<div className="live-chat-title">
						<h2>{t('Live Chat')}</h2>
						<p>{t(chatMode === 'private' ? 'Agent chat' : 'Community chat')}</p>
					</div>
					{chatMode === 'community' && (
						<span
							className="live-online"
							role="status"
							aria-label={`${t('Online connections')}: ${onlineUsers ?? '—'}`}
							title={`${t('Online connections')}: ${onlineUsers ?? '—'}`}
						>
							<span className="live-online-dot" />
							{onlineUsers === null ? '—' : onlineUsers > 30 ? '30+' : onlineUsers}
						</span>
					)}
					<button type="button" className="live-chat-close" aria-label={t('Close Live Chat')} onClick={handleOpenChat}>
						<CloseIcon />
					</button>
				</Box>
				<div className="private-chat-tabs">
					<button type="button" aria-pressed={chatMode === 'private'} onClick={() => setChatMode('private')}>
						{t('Agent chat')}
					</button>
					<button type="button" aria-pressed={chatMode === 'community'} onClick={() => setChatMode('community')}>
						{t('Community chat')}
					</button>
				</div>
				{chatMode === 'private' ? (
					<FirebaseChat open={open} agentId={agentId} carContext={carContext} contactRequest={contactRequest} />
				) : (
					<>
						<Box className={'chat-content'} id="chat-content" ref={chatContentRef} component={'div'}>
							<ScrollableFeed>
								<Stack className={'chat-main'}>
									<Box flexDirection={'row'} style={{ display: 'flex' }} sx={{ m: '10px 0px' }} component={'div'}>
										<div className={'welcome'}>{t('Welcome to Live chat!')}</div>
									</Box>
									{messagesList.map(({ text, memberData }, index) => {
										const own = Boolean(user?._id && memberData?._id === user._id);
										const name = own ? t('You') : memberData?.memberNick || t('Guest');
										return (
											<div key={index} className={`live-message-row ${own ? 'live-message-own' : ''}`}>
												{!own && (
													<Avatar
														alt={name}
														src={
															memberData?.memberImage
																? imageUrl(memberData.memberImage)
																: '/img/profile/defaultUser.svg'
														}
													/>
												)}
												<div className="live-message-body">
													<span className="live-message-name">{name}</span>
													<div className={own ? 'msg-right' : 'msg-left'}>{text}</div>
												</div>
											</div>
										);
									})}
								</Stack>
							</ScrollableFeed>
						</Box>
						<Box className={'chat-bott'} component={'div'}>
							<input
								type={'text'}
								name={'message'}
								className={'msg-input'}
								placeholder={t('Type message')}
								aria-label={t('Live Chat message')}
								value={messageInput}
								onChange={getInputMessageHandler}
								onKeyDown={getKeyHandler}
							/>
							<button
								type="button"
								aria-label={t('Send Live Chat message')}
								className={'send-msg-btn'}
								onClick={onClickHandler}
							>
								<SendIcon style={{ color: '#fff' }} />
							</button>
						</Box>
					</>
				)}
			</Stack>
		</Stack>
	);
};

export default Chat;
