import React, { useEffect, useRef, useState } from 'react';
import { MarkChatUnread, SmartToyOutlined } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Chat from './Chat';
import AiAssistant from './AiAssistant';

export default function SupportChat() {
	const { t: translate } = useTranslation('common');
	const { locale } = useRouter();
	const t = (key: string) => translate(key, { lng: locale ?? 'en' });
	const [panel, setPanel] = useState<'live' | 'ai' | null>(null);
	const liveButton = useRef<HTMLButtonElement>(null);
	const aiButton = useRef<HTMLButtonElement>(null);
	const root = useRef<HTMLDivElement>(null);
	const contactOpener = useRef<HTMLElement | null>(null);
	const close = () => {
		const button = panel === 'ai' ? aiButton : liveButton;
		setPanel(null);
		(contactOpener.current ?? button.current)?.focus();
		contactOpener.current = null;
	};
	useEffect(() => {
		if (panel === 'live') root.current?.querySelector<HTMLInputElement>('.msg-input')?.focus();
	}, [panel]);
	useEffect(() => {
		const openAi = () => {
			contactOpener.current = null;
			setPanel('ai');
		};
		const contactAgent = () => {
			contactOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			setPanel('live');
		};
		window.addEventListener('anorcar:open-ai', openAi);
		window.addEventListener('anorcar:contact-agent', contactAgent);
		return () => {
			window.removeEventListener('anorcar:open-ai', openAi);
			window.removeEventListener('anorcar:contact-agent', contactAgent);
		};
	}, []);

	return (
		<div
			ref={root}
			className="support-widget"
			onKeyDown={(event) => {
				if (event.key === 'Escape' && panel) {
					event.stopPropagation();
					close();
				}
			}}
		>
			<Chat open={panel === 'live'} onOpenChange={(open) => (open ? setPanel('live') : close())} hideLauncher />
			<AiAssistant open={panel === 'ai'} onClose={close} />
			<div className="support-launchers">
				<button
					ref={aiButton}
					type="button"
					className="support-ai-button"
					aria-label={t('AI assistant')}
					title={t('AI assistant')}
					aria-expanded={panel === 'ai'}
					aria-controls="anorcar-ai-panel"
					onClick={() => {
						contactOpener.current = null;
						panel === 'ai' ? close() : setPanel('ai');
					}}
				>
					<SmartToyOutlined />
				</button>
				<button
					ref={liveButton}
					type="button"
					className="support-live-button"
					aria-label={t('Live Chat')}
					title={t('Live Chat')}
					aria-expanded={panel === 'live'}
					aria-controls="anorcar-live-panel"
					onClick={() => {
						contactOpener.current = null;
						panel === 'live' ? close() : setPanel('live');
					}}
				>
					<MarkChatUnread />
				</button>
			</div>
		</div>
	);
}
