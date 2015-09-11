interface Hashable<T> {
	// [ActualSet.hash]:(ele:T)=>string; [x:string]:any; // no work
}
const test = "a";
class ActualSet<T> implements Set<T> {
	static hash = Symbol("hasher for ActualSet");
	private map = new Map<string, T>();
	private hasher: (ele: T) => string;
	constructor(hasher: ((ele: T) => string) | Hashable<T>, source?: Iterable<T>) {
		if ((<any>hasher)[ActualSet.hash]) this.hasher = (<any>hasher)[ActualSet.hash];
		else this.hasher = <(ele: T) => string>hasher;
		if (source !== undefined) for (let e of source) this.add(e);
	}

	get size() { return this.map.size; }

    add(item: T) {
        this.map.set(this.hasher(item), item);
		return this;
    }

	clear() {
		this.map.clear();
		return this;
	}

	delete(item: T) {
		return this.map.delete(this.hasher(item));
	}

	entries(): IterableIterator<[T, T]> {
		let realIt = this.map.values();
		let it: Iterator<[T, T]> = {
			next: realIt.next.bind(realIt),
			return: realIt.return.bind(realIt),
			throw: realIt.throw.bind(realIt)
		};
		let it2 = <IterableIterator<[T, T]>>it;
		it2[Symbol.iterator] = () => it2;
		return it2;
	}

    [Symbol.iterator]() {
        return this.map.values();
    }

	has(item: T) {
		return this.map.has(this.hasher(item));
	}
	forEach(callbackfn: (value: T, index: T, set: Set<T>) => void, thisArg: any = this): void {
		for (let v of this) callbackfn.call(thisArg, v, v);
	}
	keys() {
		return this.map.values();
	}
	values() {
		return this.map.values();
	}
	get [Symbol.toStringTag]() {
		return this.map[Symbol.toStringTag];
	}
}

module Util {
	function componentToHex(c: number) {
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}

	export function rgbToHex(r: number, g: number, b: number) {
		return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
	}
	// Based on http://stackoverflow.com/a/565282/64009
	export function intersect(a: [Point, Point], b: [Point, Point]) {
		function cross({x, y}: Point, p2: Point) {
			return x * p2.y - y * p2.x;
		}
		// Check if the segments are exactly the same (or just reversed).
		if (a[0] === b[0] && a[1] === b[1] || a[0] === b[1] && a[1] === b[0]) return true;

		// Represent the segments as p + tr and q + us, where t and u are scalar
		// parameters.
		var p = a[0],
			r: Point = { x: a[1].x - p.x, y: a[1].y - p.y },
			q = b[0],
			s: Point = { x: b[1].x - q.x, y: b[1].y - q.y };
		var rxs = cross(r, s),
			q_p: Point = { x: q.x - p.x, y: q.y - p.y },
			t = cross(q_p, s) / rxs,
			u = cross(q_p, r) / rxs,
			epsilon = 1e-6;

		return t > epsilon && t < 1 - epsilon && u > epsilon && u < 1 - epsilon;
	}

	export function array<T>(size: number, supplier: (index: number) => T): Array<T> {
		const arr = new Array<T>(size);
		for (let i = 0; i < arr.length; i++) arr[i] = supplier(i);
		return arr;
	}

	export function shuffle(array: any[]) {
		let currentIndex = array.length;
		// While there remain elements to shuffle...
		while (0 !== currentIndex) {

			// Pick a remaining element...
			let randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			let temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	}
}