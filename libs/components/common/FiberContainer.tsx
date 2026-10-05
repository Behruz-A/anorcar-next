import React, { useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense } from 'react';
import { Preload, Image as ImageImpl } from '@react-three/drei';
import { ScrollControls, Scroll } from './ScrollControls';
import * as THREE from 'three';

function Image(props: any) {
	const ref = useRef<THREE.Group>();
	const group = useRef<THREE.Group>();

	return (
		// @ts-ignore
		<group ref={group}>
			<ImageImpl ref={ref} {...props} />
		</group>
	);
}

function Page({ m = 0.4, urls, ...props }: any) {
	const { width } = useThree((state) => state.viewport);
	const w = width < 10 ? 1.5 / 3 : 1 / 3;

	return (
		<group {...props}>
			<Image position={[-width * w, 0, -1]} scale={[width * w - m * 2, 5, 1]} url={urls[0]} />
			<Image position={[0, 0, 0]} scale={[width * w - m * 2, 5, 1]} url={urls[1]} />
			<Image position={[width * w, 0, 1]} scale={[width * w - m * 2, 5, 1]} url={urls[2]} />
		</group>
	);
}

function Pages() {
	const { width } = useThree((state) => state.viewport);

	return (
		<>
			<Page position={[width * 0, 0, 0]} urls={['/img/fiber/img7.jpg', '/img/fiber/img8.jpg', '/img/fiber/img1.jpg']} />
			<Page position={[width * 1, 0, 0]} urls={['/img/fiber/img4.jpg', '/img/fiber/img5.jpg', '/img/fiber/img6.jpg']} />
			<Page position={[width * 2, 0, 0]} urls={['/img/fiber/img2.jpg', '/img/fiber/img3.jpg', '/img/fiber/img4.jpg']} />
			<Page position={[width * 3, 0, 0]} urls={['/img/fiber/img7.jpg', '/img/fiber/img8.jpg', '/img/fiber/img1.jpg']} />
			<Page position={[width * 4, 0, 0]} urls={['/img/fiber/img4.jpg', '/img/fiber/img5.jpg', '/img/fiber/img6.jpg']} />
		</>
	);
}

export default function FiberContainer() {
	return (
		<div className="threeJSContainer" style={{ marginTop: '100px', width: '100%', height: '512px' }}>
			<Canvas gl={{ antialias: false }} dpr={[1, 1.5]}>
				<Suspense fallback={null}>
					<ScrollControls infinite horizontal damping={4} pages={4} distance={1}>
						<Scroll>
							<Pages />
						</Scroll>
					</ScrollControls>
					<Preload />
				</Suspense>
			</Canvas>
		</div>

	);
}
