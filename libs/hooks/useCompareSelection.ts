import { useEffect, useState, useSyncExternalStore } from 'react';
import { ApolloClient, useApolloClient, gql } from '@apollo/client';
import { GET_CAR } from '../../apollo/user/query';
import { Car } from '../types/car/car';
import { COMPARE_SESSION_KEY, CompareSelection, parseCompareSlots } from '../compareSelection';

// Matches the complete Car shape returned by existing catalog/detail queries.
export const COMPARE_CAR_CACHE = gql`
	fragment CompareCarCache on Car {
		_id
		carStatus
		carFuelType
		carCondition
		carModel
		carYear
		carMileage
		carLocation
		carAddress
		carTransmission
		carTitle
		carPrice
		carColor
		carViews
		carLikes
		carComments
		carRank
		carImages
		brandId
		carDesc
		carBarter
		carRent
		memberId
		soldAt
		deletedAt
		createdAt
		updatedAt
		brandData {
			_id
			brandName
			brandLogo
			brandStatus
		}
		memberData {
			_id
			memberType
			memberStatus
			memberNick
			memberPhone
			memberFullName
			memberImage
			memberAddress
			memberDesc
			memberCars
			memberLikes
			memberViews
		}
		meLiked {
			memberId
			likeRefId
			myFavorite
		}
	}
`;
const loaders = new WeakMap<ApolloClient<object>, (id: string) => Promise<Car>>();
export function createCompareCarLoader(client: ApolloClient<object>) {
	const existing = loaders.get(client);
	if (existing) return existing;
	const pending = new Map<string, Promise<Car>>();
	const load = async (id: string) => {
		const cacheId = client.cache.identify({ __typename: 'Car', _id: id });
		const cached = cacheId ? client.readFragment<Car>({ id: cacheId, fragment: COMPARE_CAR_CACHE }) : null;
		if (cached) return cached;
		let request = pending.get(id);
		if (!request) {
			request = client
				.query<{ getCar: Car }>({ query: GET_CAR, variables: { input: id }, fetchPolicy: 'cache-first' })
				.then((result) => result.data.getCar);
			pending.set(id, request);
			void request
				.finally(() => {
					if (pending.get(id) === request) pending.delete(id);
				})
				.catch(() => {});
		}
		return request;
	};
	loaders.set(client, load);
	return load;
}
export function useCompareSelection() {
	const client = useApolloClient();
	const [selection] = useState(() => new CompareSelection(createCompareCarLoader(client)));
	const state = useSyncExternalStore(selection.subscribe, selection.getSnapshot, selection.getSnapshot);
	useEffect(() => {
		let ids: (string | null)[] = [null, null, null];
		try {
			ids = parseCompareSlots(JSON.parse(sessionStorage.getItem(COMPARE_SESSION_KEY) ?? '[]'));
		} catch {}
		selection.restore(ids);
		const persist = selection.subscribe(() => {
			try {
				sessionStorage.setItem(COMPARE_SESSION_KEY, JSON.stringify(selection.getSnapshot().ids));
			} catch {}
		});
		return () => {
			persist();
			selection.cancel();
		};
	}, [selection]);
	return { ...state, selection };
}
