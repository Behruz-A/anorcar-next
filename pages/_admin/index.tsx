import React, { useEffect } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../libs/components/layout/LayoutAdmin';
import { useRouter } from 'next/router';

const AdminHome: NextPage = (props: any) => {
	const router = useRouter();

	/** LIFECYCLES **/
	useEffect(() => {
		router.push('/_admin/users');
	}, []);
	return <></>;
};

export default withAdminLayout(AdminHome);
