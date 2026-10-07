import { useTranslation } from 'next-i18next';
import React, { useCallback, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Box, Button, Checkbox, FormControlLabel, FormGroup, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import { logIn, signUp } from '../../libs/auth';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Join: NextPage = () => {
 const { t } = useTranslation('common');
	const router = useRouter();
	const device = useDeviceDetect();
	const [input, setInput] = useState({ nick: '', password: '', phone: '', type: 'USER' });
	const [loginView, setLoginView] = useState<boolean>(true);

	/** HANDLERS **/
	const viewChangeHandler = (state: boolean) => {
		setLoginView(state);
	};

	const checkUserTypeHandler = (e: any) => {
		const checked = e.target.checked;
		if (checked) {
			const value = e.target.name;
			handleInput('type', value);
		} else {
			handleInput('type', 'USER');
		}
	};

	const handleInput = useCallback((name: any, value: any) => {
		setInput((prev) => {
			return { ...prev, [name]: value };
		});
	}, []);

	const doLogin = useCallback(async () => {
		try {
			await logIn(input.nick, input.password);
			const referrer = typeof router.query.referrer === 'string' && router.query.referrer.startsWith('/') && !router.query.referrer.startsWith('//') ? router.query.referrer : '/';
			await router.push(referrer);
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	}, [input, router]);

	const doSignUp = useCallback(async () => {
		try {
			await signUp(input.nick, input.password, input.phone, input.type);
			const referrer = typeof router.query.referrer === 'string' && router.query.referrer.startsWith('/') && !router.query.referrer.startsWith('//') ? router.query.referrer : '/';
			await router.push(referrer);
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	}, [input, router]);

	{
		return (
			<Stack className={'join-page'}>
				<Stack className={'container'}>
					<Stack className={'main'}>
						<Stack className={'left'}>
							{/* @ts-ignore */}
							<Box className={'logo'}>
								<img src="/img/logo/anorcar.svg" alt="" />
								<span>ANORCAR</span>
							</Box>
							<Box className={'info'}>
								<span>{loginView ? 'login' : 'signup'}</span>
								<p>{loginView ? 'Login' : 'Sign'} in with this account across the following sites.</p>
							</Box>
							<Box className={'input-wrap'}>
								<div className={'input-box'}>
									<span>{t("Nickname")}</span>
									<input
										type="text"
										placeholder={'Enter Nickname'}
										onChange={(e) => handleInput('nick', e.target.value)}
										required={true}
										onKeyDown={(event) => {
											if (event.key == 'Enter' && loginView) doLogin();
											if (event.key == 'Enter' && !loginView) doSignUp();
										}}
									/>
								</div>
								<div className={'input-box'}>
									<span>{t("Password")}</span>
									<input
										type="text"
										placeholder={'Enter Password'}
										onChange={(e) => handleInput('password', e.target.value)}
										required={true}
										onKeyDown={(event) => {
											if (event.key == 'Enter' && loginView) doLogin();
											if (event.key == 'Enter' && !loginView) doSignUp();
										}}
									/>
								</div>
								{!loginView && (
									<div className={'input-box'}>
										<span>{t("Phone")}</span>
										<input
											type="text"
											placeholder={'Enter Phone'}
											onChange={(e) => handleInput('phone', e.target.value)}
											required={true}
											onKeyDown={(event) => {
												if (event.key == 'Enter') doSignUp();
											}}
										/>
									</div>
								)}
							</Box>
							<Box className={'register'}>
								{!loginView && (
									<div className={'type-option'}>
										<span className={'text'}>{t("I want to be registered as:")}</span>
										<div>
											<FormGroup>
												<FormControlLabel
													control={
														<Checkbox
															size="small"
															name={'USER'}
															onChange={checkUserTypeHandler}
															checked={input?.type == 'USER'}
														/>
													}
													label={t("User")}
												/>
											</FormGroup>
											<FormGroup>
												<FormControlLabel
													control={
														<Checkbox
															size="small"
															name={'AGENT'}
															onChange={checkUserTypeHandler}
															checked={input?.type == 'AGENT'}
														/>
													}
													label={t("Agents")}
												/>
											</FormGroup>
										</div>
									</div>
								)}

								{loginView && (
									<div className={'remember-info'}>
										<FormGroup>
											<FormControlLabel control={<Checkbox defaultChecked size="small" />} label={t("Remember me")} />
										</FormGroup>
										<a>{t("Lost your password?")}</a>
									</div>
								)}

								{loginView ? (
									<Button
										variant="contained"
										endIcon={<img src="/img/icons/rightup.svg" alt="" />}
										disabled={input.nick == '' || input.password == ''}
										onClick={doLogin}
									>{t("LOGIN")}</Button>
								) : (
									<Button
										variant="contained"
										disabled={input.nick == '' || input.password == '' || input.phone == '' || input.type == ''}
										onClick={doSignUp}
										endIcon={<img src="/img/icons/rightup.svg" alt="" />}
									>{t("SIGNUP")}</Button>
								)}
							</Box>
							<Box className={'ask-info'}>
								{loginView ? (
									<p>
										Not registered yet?
										<b
											onClick={() => {
												viewChangeHandler(false);
											}}
										>{t("SIGNUP")}</b>
									</p>
								) : (
									<p>
										Have account?
										<b onClick={() => viewChangeHandler(true)}>{t("LOGIN")}</b>
									</p>
								)}
							</Box>
						</Stack>
						<Stack className={'right'}></Stack>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default withLayoutBasic(Join);
