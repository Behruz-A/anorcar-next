import { Car } from './types/car/car';
import { CarStatus } from './enums/car.enum';
import { Message } from './enums/common.enum';
import { MAX_COMPARE_CARS } from './carCompare';

export const COMPARE_SESSION_KEY = 'anorcar.compare.selection';
export function parseCompareSlots(value: unknown): (string | null)[] {
	const seen = new Set<string>();
	return Array.from({ length: MAX_COMPARE_CARS }, (_, index) => {
		const id = Array.isArray(value) ? value[index] : null;
		if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id) || seen.has(id.toLowerCase())) return null;
		seen.add(id.toLowerCase());
		return id.toLowerCase();
	});
}
export const availableCompareCar = (car: Car) => car?.carStatus === CarStatus.ACTIVE && !car.soldAt && !car.deletedAt;
export function replaceCompareCar(slots: (Car | null)[], car: Car, index: number): (Car | null)[] {
	if (
		!Number.isInteger(index) ||
		index < 0 ||
		index >= MAX_COMPARE_CARS ||
		!availableCompareCar(car) ||
		slots.some((item) => item?._id === car._id)
	)
		return slots;
	return slots.map((item, i) => (i === index ? car : item));
}

export class CompareSelection {
	private generation = 0;
	private revisions = [0, 0, 0];
	private listeners = new Set<() => void>();
	private inFlight = new Map<string, Promise<Car>>();
	private state = {
		slots: [null, null, null] as (Car | null)[],
		ids: [null, null, null] as (string | null)[],
		pending: [false, false, false],
		errors: [false, false, false],
		initializing: true,
		unavailable: false,
	};
	constructor(private load: (id: string) => Promise<Car>) {}
	getSnapshot = () => this.state;
	subscribe = (listener: () => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};
	private publish(patch: Partial<typeof this.state>) {
		this.state = { ...this.state, ...patch };
		this.listeners.forEach((listener) => listener());
	}
	cancel = () => {
		this.generation++;
	};
	restore(ids: (string | null)[]) {
		const saved = parseCompareSlots(ids);
		this.publish({ ids: saved, initializing: false, unavailable: false, errors: [false, false, false] });
		const generation = ++this.generation;
		saved.forEach((id, index) => {
			if (id && !this.state.slots[index]) void this.resolve(index, id, generation);
		});
	}
	private async resolve(index: number, id: string, generation: number) {
		const revision = this.revisions[index];
		this.publish({
			pending: this.state.pending.map((value, i) => (i === index ? true : value)),
			errors: this.state.errors.map((value, i) => (i === index ? false : value)),
		});
		let request = this.inFlight.get(id);
		if (!request) {
			request = Promise.resolve().then(() => this.load(id));
			this.inFlight.set(id, request);
			void request
				.finally(() => {
					if (this.inFlight.get(id) === request) this.inFlight.delete(id);
				})
				.catch(() => {});
		}
		const current = () =>
			generation === this.generation && revision === this.revisions[index] && this.state.ids[index] === id;
		try {
			const car = await request;
			if (!current()) return;
			if (car._id !== id || !availableCompareCar(car)) {
				this.remove(index);
				this.publish({ unavailable: true });
				return;
			}
			this.publish({
				slots: this.state.slots.map((value, i) => (i === index ? car : value)),
				pending: this.state.pending.map((value, i) => (i === index ? false : value)),
			});
		} catch (error) {
			if (!current()) return;
			const unavailable = (error as { graphQLErrors?: { message: string }[] })?.graphQLErrors?.some(
				(item) => item.message === Message.NO_DATA_FOUND,
			);
			if (unavailable) {
				this.remove(index);
				this.publish({ unavailable: true });
			} else
				this.publish({
					errors: this.state.errors.map((value, i) => (i === index ? true : value)),
					pending: this.state.pending.map((value, i) => (i === index ? false : value)),
				});
		}
	}
	select(car: Car, index: number): boolean {
		const slots = replaceCompareCar(this.state.slots, car, index);
		if (slots === this.state.slots || this.state.ids.some((id, i) => i !== index && id === car._id)) return false;
		this.revisions[index]++;
		this.publish({
			slots,
			ids: this.state.ids.map((id, i) => (i === index ? car._id : id)),
			pending: this.state.pending.map((value, i) => (i === index ? false : value)),
			errors: this.state.errors.map((value, i) => (i === index ? false : value)),
		});
		return true;
	}
	remove(index: number) {
		if (index < 0 || index >= MAX_COMPARE_CARS) return;
		this.revisions[index]++;
		this.publish({
			slots: this.state.slots.map((value, i) => (i === index ? null : value)),
			ids: this.state.ids.map((value, i) => (i === index ? null : value)),
			pending: this.state.pending.map((value, i) => (i === index ? false : value)),
			errors: this.state.errors.map((value, i) => (i === index ? false : value)),
		});
	}
	clear = () => {
		this.generation++;
		this.revisions = this.revisions.map((value) => value + 1);
		this.publish({
			slots: [null, null, null],
			ids: [null, null, null],
			pending: [false, false, false],
			errors: [false, false, false],
			initializing: false,
			unavailable: false,
		});
	};
	retry = (index: number) => {
		const id = this.state.ids[index];
		if (id && !this.state.pending[index]) void this.resolve(index, id, this.generation);
	};
}
