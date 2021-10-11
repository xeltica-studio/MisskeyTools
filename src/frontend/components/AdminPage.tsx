import React, { useEffect, useState } from 'react';

import { LOCALSTORAGE_KEY_TOKEN } from '../const';
import { useGetSessionQuery } from '../services/session';
import { Skeleton } from './Skeleton';
import { IAnnouncement } from '../../common/types/announcement';
import { $delete, $get, $post, $put } from '../misc/api';
import { Card } from './Card';


export const AdminPage: React.VFC = () => {
	const { data, error } = useGetSessionQuery(undefined);

	const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
	const [selectedAnnouncement, selectAnnouncement] = useState<IAnnouncement | null>(null);
	const [isAnnouncementsLoaded, setAnnouncementsLoaded] = useState(false);
	const [isEditMode, setEditMode] = useState(false);
	const [isDeleteMode, setDeleteMode] = useState(false);
	const [draftTitle, setDraftTitle] = useState('');
	const [draftBody, setDraftBody] = useState('');

	const submitAnnouncement = async () => {
		if (selectedAnnouncement) {
			await $put('announcements', {
				id: selectedAnnouncement.id,
				title: draftTitle,
				body: draftBody,
			});
		} else {
			await $post('announcements', {
				title: draftTitle,
				body: draftBody,
			});
		}
		selectAnnouncement(null);
		setDraftTitle('');
		setDraftBody('');
		setEditMode(false);
		fetchAll();
	};

	const deleteAnnouncement = ({id}: IAnnouncement) => {
		$delete('announcements', {id}).then(() => {
			fetchAll();
		});
	};

	const fetchAll = () => {
		setAnnouncements([]);
		setAnnouncementsLoaded(false);
		$get<IAnnouncement[]>('announcements').then(announcements => {
			setAnnouncements(announcements ?? []);
			setAnnouncementsLoaded(true);
		});
	};

	/**
	 * Session APIのエラーハンドリング
	 * このAPIがエラーを返した = トークンが無効 なのでトークンを削除してログアウトする
	 */
	useEffect(() => {
		if (error) {
			console.error(error);
			localStorage.removeItem(LOCALSTORAGE_KEY_TOKEN);
			location.reload();
		}
	}, [error]);

	/**
	 * Edit Modeがオンのとき、Delete Modeを無効化する（誤操作防止）
	 */
	useEffect(() => {
		if (isEditMode) {
			setDeleteMode(false);
		}
	}, [isEditMode]);

	/**
	 * お知らせ取得
	 */
	useEffect(() => {
		fetchAll();
	}, []);

	useEffect(() => {
		if (selectedAnnouncement) {
			setDraftTitle(selectedAnnouncement.title);
			setDraftBody(selectedAnnouncement.body);
		} else {
			setDraftTitle('');
			setDraftBody('');
		}
	}, [selectedAnnouncement]);

	return !data || !isAnnouncementsLoaded ? (
		<div className="vstack">
			<Skeleton width="100%" height="1rem" />
			<Skeleton width="100%" height="1rem" />
			<Skeleton width="100%" height="2rem" />
			<Skeleton width="100%" height="160px" />
		</div>
	) : (
		<div className="fade vstack">
			{
				!data.isAdmin ? (
					<p>You are not an administrator and cannot open this page.</p>
				) : (
					<>
						<article>
							<h2>Announcements</h2>
							{!isEditMode && (
								<label className="input-switch mb-1">
									<input type="checkbox" checked={isDeleteMode} onChange={e => setDeleteMode(e.target.checked)}/>
									<div className="switch"></div>
									<span>Delete Mode</span>
								</label>
							)}
							<Card bodyClassName={isEditMode ? '' : 'px-0'}>
								{ !isEditMode ? (
									<>
										{isDeleteMode && <div className="ml-2 text-danger">Click the item to delete.</div>}
										<div className="large menu">
											{announcements.map(a => (
												<button className="item fluid" key={a.id} onClick={() => {
													if (isDeleteMode) {
														deleteAnnouncement(a);
													} else {
														selectAnnouncement(a);
														setEditMode(true);
													}
												}}>
													{isDeleteMode && <i className="icon bi bi-trash text-danger" />}
													{a.title}
												</button>
											))}
											{!isDeleteMode && (
												<button className="item fluid" onClick={() => setEditMode(true)}>
													<i className="icon bi bi-plus"/ >
													Create New
												</button>
											)}
										</div>
									</>
								) : (
									<div className="vstack">
										<label className="input-field">
											Title
											<input type="text" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} />
										</label>
										<label className="input-field">
											Body
											<textarea className="input-field" value={draftBody} rows={10} onChange={e => setDraftBody(e.target.value)}/>
										</label>
										<div className="hstack" style={{justifyContent: 'flex-end'}}>
											<button className="btn primary" onClick={submitAnnouncement} disabled={!draftTitle || !draftBody}>
												Submit
											</button>
											<button className="btn" onClick={() => {
												selectAnnouncement(null);
												setEditMode(false);
											}}>
												Cancel
											</button>
										</div>
									</div>
								)}
							</Card>
						</article>
					</>
				)
			}
		</div>
	);
};


