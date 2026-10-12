import React, { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Alert, CircularProgress, IconButton } from '@mui/material';
import { Close, Send, SmartToyOutlined } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { ASK_AI_ASSISTANT } from '../../apollo/user/mutation';
import { AiChatInput, AiChatResponse } from '../types/ai/ai-chat';

interface ChatMessage { id: number; role: 'user' | 'ai'; text: string; }
const suggestions = ['How do I buy a car?', 'How can I sell my car?', 'How do I contact an agent?', 'How does ANORCAR work?'];
const unavailable = 'AI assistant is temporarily unavailable. Please try again later.';
const limited = 'Too many AI requests. Please wait a minute and try again.';

export default function AiAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
	const { t: translate } = useTranslation('common');
	const { locale } = useRouter();
	const t = (key: string) => translate(key, { lng: locale ?? 'en' });
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [error, setError] = useState('');
	const [pending, setPending] = useState(false);
	const lock = useRef(false);
	const sequence = useRef(0);
	const alive = useRef(true);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const historyRef = useRef<HTMLDivElement>(null);
	const [ask] = useMutation<{ askAiAssistant: AiChatResponse }, { input: AiChatInput }>(ASK_AI_ASSISTANT);

	useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
	useEffect(() => { if (open && !pending) inputRef.current?.focus(); }, [open, pending]);
	useEffect(() => {
		if (open && historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
	}, [open, messages, pending, error]);

	const send = async (message = input) => {
		const text = message.trim();
		if (lock.current || !text) return;
		if (message.length > 1000) { setError('Keep your message under 1000 characters.'); return; }
		lock.current = true;
		setPending(true); setError(''); setInput(text);
		const userMessage: ChatMessage = { id: ++sequence.current, role: 'user', text };
		setMessages((previous) => [...previous, userMessage].slice(-40));
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 18000);
		try {
			const { data } = await ask({ variables: { input: { message: text } }, context: { fetchOptions: { signal: controller.signal } } });
			const answer = data?.askAiAssistant.answer?.trim();
			if (!answer) throw new Error(unavailable);
			if (alive.current) {
				setMessages((previous) => [...previous, { id: ++sequence.current, role: 'ai' as const, text: answer }].slice(-40));
				setInput('');
			}
		} catch (cause) {
			if (alive.current) {
				const details = cause as { graphQLErrors?: { message: string }[]; message?: string };
				setError(details.graphQLErrors?.some((item) => item.message === limited) || details.message === limited ? limited : unavailable);
				setMessages((previous) => previous.filter((item) => item.id !== userMessage.id));
			}
		} finally {
			clearTimeout(timer); lock.current = false;
			if (alive.current) setPending(false);
		}
	};
	const submit = (event: FormEvent) => { event.preventDefault(); void send(); };
	const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); }
	};

	return (
		<section id="anorcar-ai-panel" className="ai-panel" hidden={!open} role="dialog" aria-labelledby="anorcar-ai-title">
			<header className="ai-header">
				<SmartToyOutlined aria-hidden="true" />
				<div><h2 id="anorcar-ai-title">{t('ANORCAR AI Assistant')}</h2><p><span className="ai-status-dot" />{t('Automated assistant')}</p></div>
				<IconButton aria-label={t('Close AI assistant')} onClick={onClose}><Close /></IconButton>
			</header>
			<div className="ai-history" ref={historyRef}>
				<div className="ai-message ai-message-ai">{t("Hi! I'm ANORCAR AI. How can I help you today?")}</div>
				{messages.length === 0 && <div className="ai-suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} disabled={pending} onClick={() => void send(t(suggestion))}>{t(suggestion)}</button>)}</div>}
				<div className="ai-conversation" role="log" aria-live="polite" aria-relevant="additions text">{messages.map((message) => <div key={message.id} className={`ai-message ai-message-${message.role}`}><span className="ai-sr-only">{t(message.role === 'ai' ? 'AI assistant' : 'You')}:</span>{message.text}</div>)}</div>
				{pending && <div className="ai-pending" role="status"><CircularProgress size={16} /><span>{t('Thinking...')}</span></div>}
			</div>
			{error && <Alert className="ai-error" severity="error">{t(error)}</Alert>}
			<form className="ai-compose" onSubmit={submit}>
				<label className="ai-sr-only" htmlFor="anorcar-ai-message">{t('Message AI assistant')}</label>
				<textarea ref={inputRef} id="anorcar-ai-message" rows={2} maxLength={1000} value={input} disabled={pending} onChange={(event) => { setInput(event.target.value); setError(''); }} onKeyDown={keyDown} placeholder={t('Ask about ANORCAR or cars...')} />
				<IconButton type="submit" disabled={pending || !input.trim()} aria-label={t('Send AI message')}><Send /></IconButton>
			</form>
			<p className="ai-note">{t('AI can make mistakes. Check current details with the agent.')}</p>
		</section>
	);
}
