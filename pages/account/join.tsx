import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Alert, Button, CircularProgress } from '@mui/material';
import { VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { logIn, signUp } from '../../libs/auth';
import { MemberType } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';

export const getStaticProps = async ({ locale }: any) => ({
 props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const Join: NextPage = () => {
 const { t } = useTranslation('common');
 const router = useRouter();
 const signup = router.query.mode === 'signup';
 const [input, setInput] = useState({ nick: '', password: '', phone: '', confirm: '', type: MemberType.USER });
 const [showPassword, setShowPassword] = useState(false);
 const [pending, setPending] = useState(false);
 const [error, setError] = useState('');
 const [errors, setErrors] = useState<Record<string, string>>({});
 const submitting = useRef(false);
 const nicknameRef = useRef<HTMLInputElement>(null);
 const passwordRef = useRef<HTMLInputElement>(null);
 const phoneRef = useRef<HTMLInputElement>(null);
 const confirmRef = useRef<HTMLInputElement>(null);

 useEffect(() => {
  setInput(previous => ({ ...previous, password: '', confirm: '' }));
  setShowPassword(false);
  setError('');
  setErrors({});
 }, [signup]);

 const change = (name: keyof typeof input, value: string) => {
  setInput(previous => ({ ...previous, [name]: value }));
  setErrors(previous => ({ ...previous, [name]: '', ...(name === 'password' ? { confirm: '' } : {}) }));
  setError('');
 };

 const submit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (submitting.current) return;
  const next: Record<string, string> = {};
  const nick = input.nick.trim();
  if (nick.length < 3 || nick.length > 12) next.nick = 'Use 3–12 characters for your nickname.';
  if (input.password.length < 5 || input.password.length > 12) next.password = 'Use 5–12 characters for your password.';
  if (signup && !input.phone.trim()) next.phone = 'Enter your phone number.';
  if (signup && input.password !== input.confirm) next.confirm = 'Passwords do not match.';
  setErrors(next);
  setError('');
  if (Object.keys(next).length) {
   const refs = { nick: nicknameRef, password: passwordRef, phone: phoneRef, confirm: confirmRef };
   refs[Object.keys(next)[0] as keyof typeof refs].current?.focus();
   return;
  }
  submitting.current = true;
  setPending(true);
  try {
   if (signup) await signUp(nick, input.password, input.phone.trim(), input.type);
   else await logIn(nick, input.password);
  } catch (cause) {
   const message = cause instanceof Error ? cause.message : '';
   const messages: Record<string, string> = {
    [Message.NO_MEMBER_NICK]: 'Check your nickname and password, then try again.',
    [Message.WRONG_PASSWORD]: 'Check your nickname and password, then try again.',
    [Message.USED_MEMBER_NICK_OR_PHONE]: 'This nickname or phone number is already registered.',
    [Message.BLOCKED_USER]: 'This account is blocked. Contact support for help.',
   };
   setError(messages[message] || 'Unable to connect. Please try again.');
   submitting.current = false;
   setPending(false);
   return;
  }
  const referrer = router.query.referrer;
  const destination = typeof referrer === 'string' && /^\/(?!\/)/.test(referrer) &&
   !/[\\\u0000-\u0020]/.test(referrer) && !/^\/account\/join(?:[/?#]|$)/.test(referrer) ? referrer : '/';
  try {
   await router.push(destination);
  } catch {
   // Authentication succeeded; complete the return flow with a full navigation.
   window.location.assign(destination);
  } finally {
   submitting.current = false;
   setPending(false);
  }
 };

 const switchMode = () => {
  if (submitting.current) return;
  void router.replace({ pathname: '/account/join', query: { ...router.query, mode: signup ? 'login' : 'signup' } }, undefined, { shallow: true, scroll: false });
 };

 return (
  <section className="auth-page">
   <Head><title>{`${t(signup ? 'Create account' : 'Log in')} | ANORCAR`}</title></Head>
   <div className="auth-frame">
    <aside className="auth-visual">
     <img className="auth-photo" src="/img/car/loginpageimg.png" alt="" />
     <Link href="/" className="auth-wordmark"><img src="/img/logo/anorcar-white.svg" alt="ANORCAR" /></Link>
     <div className="auth-visual-copy">
      <h2>{t('Find your next car.')}</h2>
      <p>{t('Buy, sell and explore with ANORCAR.')}</p>
     </div>
    </aside>
    <div className="auth-panel">
     <Link className="auth-back" href="/car">{t('Back to cars')}</Link>
     <div className="auth-mode" aria-label={t('Account access')}>
      <button type="button" aria-pressed={!signup} disabled={pending} onClick={() => signup && switchMode()}>{t('Log in')}</button>
      <button type="button" aria-pressed={signup} disabled={pending} onClick={() => !signup && switchMode()}>{t('Sign up')}</button>
     </div>
     <h1>{t(signup ? 'Create your account' : 'Welcome back')}</h1>
     <p className="auth-intro">{t(signup ? 'Join ANORCAR to find or sell your next car.' : 'Log in to your ANORCAR account.')}</p>
     <form onSubmit={submit} noValidate aria-busy={pending}>
      <fieldset disabled={pending}>
       <div className="auth-field">
        <label htmlFor="auth-nick">{t('Nickname')}</label>
        <input ref={nicknameRef} id="auth-nick" name="username" autoComplete="username" value={input.nick} onChange={event => change('nick', event.target.value)} required aria-invalid={!!errors.nick} aria-describedby="auth-nick-help" />
        <span id="auth-nick-help" className={errors.nick ? 'auth-field-error' : 'auth-hint'}>{t(errors.nick || '3–12 characters.')}</span>
       </div>
       <div className="auth-field">
        <label htmlFor="auth-password">{t('Password')}</label>
        <div className="auth-password">
         <input ref={passwordRef} id="auth-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} value={input.password} onChange={event => change('password', event.target.value)} required aria-invalid={!!errors.password} aria-describedby="auth-password-help" />
         <button type="button" aria-label={t(showPassword ? 'Hide password' : 'Show password')} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</button>
        </div>
        <span id="auth-password-help" className={errors.password ? 'auth-field-error' : 'auth-hint'}>{t(errors.password || '5–12 characters.')}</span>
       </div>
       {signup && <>
        <div className="auth-field">
         <label htmlFor="auth-confirm">{t('Confirm password')}</label>
         <input ref={confirmRef} id="auth-confirm" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={input.confirm} onChange={event => change('confirm', event.target.value)} required aria-invalid={!!errors.confirm} aria-describedby={errors.confirm ? 'auth-confirm-error' : undefined} />
         {errors.confirm && <span id="auth-confirm-error" className="auth-field-error">{t(errors.confirm)}</span>}
        </div>
        <div className="auth-field">
         <label htmlFor="auth-phone">{t('Phone')}</label>
         <input ref={phoneRef} id="auth-phone" name="tel" type="tel" autoComplete="tel" value={input.phone} onChange={event => change('phone', event.target.value)} required aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'auth-phone-error' : undefined} />
         {errors.phone && <span id="auth-phone-error" className="auth-field-error">{t(errors.phone)}</span>}
        </div>
        <fieldset className="auth-roles">
         <legend>{t('How will you use ANORCAR?')}</legend>
         {[{ value: MemberType.USER, label: 'User', description: 'Find and save cars' }, { value: MemberType.AGENT, label: 'Agent', description: 'List and sell cars' }].map(role => (
          <label key={role.value} className={input.type === role.value ? 'selected' : ''}>
           <input type="radio" name="memberType" value={role.value} checked={input.type === role.value} onChange={() => change('type', role.value)} />
           <span><strong>{t(role.label)}</strong><small>{t(role.description)}</small></span>
          </label>
         ))}
        </fieldset>
       </>}
       {error && <Alert severity="error">{t(error)}</Alert>}
       <Button className="auth-submit" type="submit" variant="contained" disabled={pending} startIcon={pending ? <CircularProgress size={18} color="inherit" /> : undefined}>{t(pending ? (signup ? 'Creating account...' : 'Logging in...') : (signup ? 'Create account' : 'Log in'))}</Button>
      </fieldset>
     </form>
     <p className="auth-switch">{t(signup ? 'Already have an account?' : 'New to ANORCAR?')} <button type="button" disabled={pending} onClick={switchMode}>{t(signup ? 'Log in' : 'Sign up')}</button></p>
     <p className="auth-help"><Link href="/cs">{t('Need help signing in?')}</Link></p>
    </div>
   </div>
  </section>
 );
};

export default withLayoutBasic(Join);
