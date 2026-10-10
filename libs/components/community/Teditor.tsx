import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	MenuItem,
	Select,
	Stack,
	Tab,
	Tabs,
	TextField,
	Typography,
} from '@mui/material';
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/i18n/ko-kr';
import '@toast-ui/editor/dist/i18n/ru-ru';
import '@toast-ui/editor/dist/toastui-editor.css';
import { getJwtToken } from '../../auth';
import { imageUrl, REACT_APP_API_GRAPHQL_URL } from '../../config';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import axios from 'axios';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { CREATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { sweetErrorHandling, sweetTopSuccessAlert } from '../../sweetAlert';
import Swal from 'sweetalert2';

const MAX_IMAGE_SIZE = 15000000;
// The installed React wrapper has no unmount cleanup. Keep Strict Mode remounts empty and release editor listeners.
class ArticleEditor extends Editor {
	componentWillUnmount() {
		this.getInstance()?.destroy();
		this.getRootElement()?.replaceChildren();
	}
}
const TuiEditor = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const editorRef = useRef<ArticleEditor>(null);
	const mounted = useRef(true);
	const publishingRef = useRef(false);
	const uploadCount = useRef(0);
	const controllers = useRef(new Set<AbortController>());
	const [title, setTitle] = useState('');
	const [category, setCategory] = useState<BoardArticleCategory | ''>('');
	const [content, setContent] = useState('');
	// null preserves the existing inline-image thumbnail fallback until a cover is chosen or removed.
	const [cover, setCover] = useState<string | null>(null);
	const [inlineImage, setInlineImage] = useState('');
	const [touched, setTouched] = useState({ title: false, category: false, content: false });
	const [publishing, setPublishing] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');
	const [imageOpen, setImageOpen] = useState(false);
	const [imageMode, setImageMode] = useState(0);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imageAddress, setImageAddress] = useState('');
	const [description, setDescription] = useState('');
	const [imageError, setImageError] = useState('');
	const coverInput = useRef<HTMLInputElement>(null);
	const [createBoardArticle] = useMutation(CREATE_BOARD_ARTICLE);
	const locale = router.locale === 'kr' ? 'ko-KR' : router.locale === 'ru' ? 'ru-RU' : 'en-US';
	const selectedCover = cover ?? inlineImage;
	const busy = publishing || uploading;
	const titleError = !title.trim()
		? t('Enter an article title.')
		: title.trim().length < 3 || title.trim().length > 50
		? t('Use 3–50 characters for the title.')
		: '';
	const categoryError = category ? '' : t('Select an article category.');
	const parsed = typeof DOMParser === 'undefined' ? null : new DOMParser().parseFromString(content, 'text/html');
	const hasContent =
		!!parsed && (!!parsed.body.textContent?.replace(/[\s\u200b]/g, '') || !!parsed.querySelector('img'));
	const contentError = !hasContent
		? t('Write some article content.')
		: content.length < 3 || content.length > 250
		? t('Content must contain 3–250 characters, including formatting.')
		: '';
	const valid = !titleError && !categoryError && !contentError;
	useEffect(() => {
		const root = editorRef.current?.getRootElement();
		root?.toggleAttribute('inert', publishing);
		root?.querySelectorAll('[contenteditable="true"]').forEach((el) => {
			el.setAttribute('aria-labelledby', 'article-content-label');
			el.setAttribute('aria-describedby', 'article-content-help');
			el.setAttribute('aria-invalid', String(touched.content && !!contentError));
		});
	}, [publishing, touched.content, contentError, locale]);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			controllers.current.forEach((controller) => controller.abort());
		};
	}, []);

	const toolbarItems = useMemo(() => {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'toastui-editor-toolbar-icons image article-image-toolbar-button';
		button.setAttribute('aria-label', t('Insert Image'));
		button.title = t('Insert Image');
		button.onclick = () => {
			if (publishingRef.current || uploadCount.current) return;
			setImageFile(null);
			setImageAddress('');
			setDescription('');
			setImageError('');
			setImageMode(0);
			setImageOpen(true);
		};
		return [
			['heading', 'bold', 'italic', 'strike'],
			[{ name: 'articleImage', tooltip: t('Insert Image'), el: button }, 'table', 'link'],
			['ul', 'ol', 'task'],
		];
	}, [t]);

	const uploadImage = async (file: Blob) => {
		if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type))
			throw new Error(t('Upload a JPG, JPEG or PNG image.'));
		if (file.size > MAX_IMAGE_SIZE) throw new Error(t('Image must be 15 MB or smaller.'));
		const controller = new AbortController();
		controllers.current.add(controller);
		uploadCount.current++;
		setUploading(true);
		try {
			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) { imageUploader(file: $file, target: $target) }`,
					variables: { file: null, target: 'article' },
				}),
			);
			formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
			formData.append('0', file);
			const response = await axios.post(REACT_APP_API_GRAPHQL_URL, formData, {
				signal: controller.signal,
				headers: { 'apollo-require-preflight': 'true', Authorization: `Bearer ${getJwtToken()}` },
			});
			const path = response.data?.data?.imageUploader;
			if (!path || response.data?.errors?.length)
				throw new Error(response.data?.errors?.[0]?.message || t('Image upload failed. Please try again.'));
			return path as string;
		} finally {
			controllers.current.delete(controller);
			uploadCount.current--;
			if (mounted.current) setUploading(uploadCount.current > 0);
		}
	};

	const changeCover = async (file?: File) => {
		if (!file || publishingRef.current || uploadCount.current) return;
		setError('');
		try {
			const path = await uploadImage(file);
			if (mounted.current) setCover(path);
		} catch (err) {
			if (mounted.current) setError(err instanceof Error ? err.message : t('Image upload failed. Please try again.'));
		}
	};
	const closeImage = () => {
		if (!uploadCount.current) setImageOpen(false);
	};
	const insertImage = async () => {
		if (uploadCount.current || publishingRef.current) return;
		setImageError('');
		try {
			let url = imageAddress.trim();
			if (imageMode === 0) {
				if (!imageFile) throw new Error(t('Choose an image file.'));
				const path = await uploadImage(imageFile);
				if (!mounted.current) return;
				setInlineImage(path);
				url = imageUrl(path);
			} else {
				try {
					const parsedUrl = new URL(url);
					if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
				} catch {
					throw new Error(t('Enter a valid HTTP or HTTPS image URL.'));
				}
			}
			editorRef.current?.getInstance().exec('addImage', { imageUrl: url, altText: description.trim() });
			setContent(editorRef.current?.getInstance().getHTML() ?? '');
			setImageOpen(false);
		} catch (err) {
			if (mounted.current)
				setImageError(err instanceof Error ? err.message : t('Image upload failed. Please try again.'));
		}
	};
	const publish = async (event: React.FormEvent) => {
		event.preventDefault();
		if (publishingRef.current || uploadCount.current) return;
		setTouched({ title: true, category: true, content: true });
		if (!valid || !category) return;
		publishingRef.current = true;
		setPublishing(true);
		setError('');
		try {
			if (!user._id || !getJwtToken()) throw new Error(t('Please login first!'));
			const result = await createBoardArticle({
				variables: {
					input: {
						articleTitle: title.trim(),
						articleCategory: category,
						articleContent: editorRef.current?.getInstance().getHTML() ?? content,
						articleImage: selectedCover,
					},
				},
			});
			if (!result.data?.createBoardArticle) throw new Error(t('Article could not be published. Please try again.'));
			if (!mounted.current) return;
			await sweetTopSuccessAlert(t('Article published successfully.'), 700);
			if (mounted.current) await router.push({ pathname: '/mypage', query: { category: 'myArticles' } });
		} catch (err) {
			if (mounted.current) {
				setError(err instanceof Error ? err.message : t('Article could not be published. Please try again.'));
				void sweetErrorHandling(err);
			}
		} finally {
			publishingRef.current = false;
			if (mounted.current) setPublishing(false);
		}
	};
	const cancel = async () => {
		if (publishingRef.current || uploadCount.current) return;
		if (title || category || hasContent || selectedCover) {
			const result = await Swal.fire({
				text: t('Discard this article and leave the editor?'),
				icon: 'question',
				showCancelButton: true,
				confirmButtonText: t('Discard Article'),
				cancelButtonText: t('Keep Writing'),
				confirmButtonColor: '#f04432',
			});
			if (!result.isConfirmed) return;
		}
		await router.push({ pathname: '/mypage', query: { category: 'myArticles' } });
	};

	return (
		<form className="article-form" onSubmit={publish} noValidate>
			<fieldset disabled={busy} className="article-information">
				<div className="article-field">
					<label htmlFor="article-title">{t('Article Title')}</label>
					<TextField
						id="article-title"
						fullWidth
						value={title}
						placeholder={t('Enter your article title...')}
						onChange={(e) => setTitle(e.target.value)}
						onBlur={() => setTouched((s) => ({ ...s, title: true }))}
						error={touched.title && !!titleError}
						inputProps={{ maxLength: 50, 'aria-describedby': 'article-title-help' }}
					/>
					<p id="article-title-help" className={touched.title && titleError ? 'article-help is-error' : 'article-help'}>
						{touched.title && titleError ? titleError : t('Use 3–50 characters for the title.')}
					</p>
				</div>
				<div className="article-field article-category-field">
					<label id="article-category-label" htmlFor="article-category">
						{t('Category')}
					</label>
					<Select
						id="article-category"
						labelId="article-category-label"
						fullWidth
						displayEmpty
						value={category}
						disabled={busy}
						onChange={(e) => setCategory(e.target.value as BoardArticleCategory)}
						onBlur={() => setTouched((s) => ({ ...s, category: true }))}
						error={touched.category && !!categoryError}
						inputProps={{ 'aria-describedby': 'article-category-help' }}
					>
						<MenuItem value="" disabled>
							{t('Select a category')}
						</MenuItem>
						<MenuItem value={BoardArticleCategory.FREE}>{t('Free Board')}</MenuItem>
						<MenuItem value={BoardArticleCategory.RECOMMEND}>{t('Recommendations')}</MenuItem>
						<MenuItem value={BoardArticleCategory.NEWS}>{t('News')}</MenuItem>
						<MenuItem value={BoardArticleCategory.HUMOR}>{t('Humor')}</MenuItem>
					</Select>
					{touched.category && categoryError && (
						<p id="article-category-help" className="article-help is-error">
							{categoryError}
						</p>
					)}
				</div>
				<div className="article-field">
					<label>
						{t('Cover Image')} <span className="article-optional">{t('Optional')}</span>
					</label>
					<div className={`article-cover ${selectedCover ? 'has-image' : ''}`}>
						{selectedCover ? (
							<img src={imageUrl(selectedCover)} alt={t('Article cover preview')} />
						) : (
							<ImageOutlinedIcon aria-hidden="true" />
						)}
						<Stack className="article-cover-controls">
							<Stack direction="row" className="article-cover-buttons">
								<Button
									variant="outlined"
									startIcon={<UploadOutlinedIcon />}
									onClick={() => coverInput.current?.click()}
									disabled={busy}
								>
									{t(selectedCover ? 'Change Image' : 'Upload Image')}
								</Button>
								{selectedCover && (
									<Button disabled={busy} onClick={() => setCover('')}>
										{t('Remove Image')}
									</Button>
								)}
							</Stack>
							<Typography className="article-help">{t('JPG, JPEG or PNG. Maximum file size: 15 MB.')}</Typography>
						</Stack>
					</div>
					<input
						ref={coverInput}
						id="article-cover-file"
						type="file"
						hidden
						accept="image/jpeg,image/png"
						onChange={(e) => {
							void changeCover(e.target.files?.[0]);
							e.target.value = '';
						}}
					/>
				</div>
			</fieldset>
			<div className="article-field article-content-field">
				<label id="article-content-label">{t('Article Content')}</label>
				<div
					className={`article-editor-wrap ${touched.content && contentError ? 'has-error' : ''} ${
						publishing ? 'is-publishing' : ''
					}`}
					aria-busy={publishing}
				>
					<ArticleEditor
						key={locale}
						ref={editorRef}
						initialValue={editorRef.current?.getInstance()?.getMarkdown() ?? ''}
						placeholder={t('Start writing your article here...')}
						previewStyle="tab"
						height="auto"
						minHeight="380px"
						initialEditType="wysiwyg"
						language={locale}
						usageStatistics={false}
						toolbarItems={toolbarItems}
						onChange={() => {
							if (!publishingRef.current) setContent(editorRef.current?.getInstance().getHTML() ?? '');
						}}
						onBlur={() => setTouched((s) => ({ ...s, content: true }))}
						onLoad={() => {
							const root = editorRef.current?.getRootElement();
							root?.querySelectorAll('[contenteditable="true"]').forEach((el) => {
								el.setAttribute('aria-labelledby', 'article-content-label');
								el.setAttribute('aria-describedby', 'article-content-help');
							});
						}}
						hooks={{
							addImageBlobHook: async (file, callback) => {
								if (publishingRef.current) return;
								try {
									const path = await uploadImage(file);
									if (mounted.current) {
										setInlineImage(path);
										callback(imageUrl(path));
									}
								} catch (err) {
									if (mounted.current)
										setError(err instanceof Error ? err.message : t('Image upload failed. Please try again.'));
								}
							},
						}}
					/>
				</div>
				<p
					id="article-content-help"
					className={touched.content && contentError ? 'article-help is-error' : 'article-help'}
				>
					{touched.content && contentError
						? contentError
						: t('{{count}} / 250 characters, including formatting.', { count: content.length })}
				</p>
			</div>
			{error && (
				<p className="article-error" role="alert">
					{error}
				</p>
			)}
			<footer className="article-publish-actions">
				<span className="article-help" role="status">
					{busy ? t(uploading ? 'Uploading image...' : 'Publishing article...') : ''}
				</span>
				<Stack direction="row" className="article-publish-buttons">
					<Button variant="outlined" disabled={busy} onClick={() => void cancel()}>
						{t('Cancel')}
					</Button>
					<Button
						className="article-publish-button"
						type="submit"
						variant="contained"
						disabled={!valid || busy}
						startIcon={publishing ? <CircularProgress size={17} color="inherit" /> : <PublishOutlinedIcon />}
					>
						{t(publishing ? 'Publishing...' : 'Publish Article')}
					</Button>
				</Stack>
			</footer>
			<Dialog
				open={imageOpen}
				onClose={closeImage}
				fullWidth
				maxWidth="xs"
				className="article-image-dialog"
				aria-labelledby="article-image-title"
			>
				<DialogTitle id="article-image-title">{t('Insert Image')}</DialogTitle>
				<DialogContent>
					<Tabs
						value={imageMode}
						onChange={(_, value) => {
							setImageMode(value);
							setImageError('');
						}}
						aria-label={t('Image source')}
					>
						<Tab
							label={t('Upload File')}
							disabled={uploading}
							id="article-image-tab-file"
							aria-controls="article-image-panel"
						/>
						<Tab
							label={t('Image URL')}
							disabled={uploading}
							id="article-image-tab-url"
							aria-controls="article-image-panel"
						/>
					</Tabs>
					<div
						id="article-image-panel"
						role="tabpanel"
						aria-labelledby={imageMode === 0 ? 'article-image-tab-file' : 'article-image-tab-url'}
					>
						{imageMode === 0 ? (
							<div className="article-image-upload">
								<label htmlFor="article-inline-file">{t('Choose an image file.')}</label>
								<input
									id="article-inline-file"
									type="file"
									accept="image/jpeg,image/png"
									disabled={uploading}
									onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
								/>
								<p>{t('JPG, JPEG or PNG. Maximum file size: 15 MB.')}</p>
							</div>
						) : (
							<TextField
								autoFocus
								label={t('Image URL')}
								placeholder="https://"
								fullWidth
								value={imageAddress}
								disabled={uploading}
								onChange={(e) => setImageAddress(e.target.value)}
							/>
						)}
					</div>
					<TextField
						className="article-image-description"
						label={t('Image description (optional)')}
						fullWidth
						value={description}
						disabled={uploading}
						onChange={(e) => setDescription(e.target.value)}
					/>
					{imageError && (
						<p className="article-error" role="alert">
							{imageError}
						</p>
					)}
				</DialogContent>
				<DialogActions>
					<Button disabled={uploading} onClick={closeImage}>
						{t('Cancel')}
					</Button>
					<Button
						variant="contained"
						disabled={uploading || (imageMode === 0 ? !imageFile : !imageAddress.trim())}
						onClick={() => void insertImage()}
					>
						{t(uploading ? 'Uploading image...' : 'Insert Image')}
					</Button>
				</DialogActions>
			</Dialog>
		</form>
	);
};
export default TuiEditor;
