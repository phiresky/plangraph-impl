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
	get asPredicate(): (e: Edge) => boolean { return this.has.bind(this); }

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
	some(predicate: (t: T) => boolean): boolean {
		for (let t of this.map.values()) if (predicate(t)) return true;
		return false;
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

	export function findIntersection(line1a: Point, line1b: Point, line2a: Point, line2b: Point) {
		const denominator = ((line2b.y - line2a.y) * (line1b.x - line1a.x)) - ((line2b.x - line2a.x) * (line1b.y - line1a.y));
		if (denominator == 0) {
			return null;
		}
		let a = line1a.y - line2a.y;
		let b = line1a.x - line2a.x;
		const numerator1 = ((line2b.x - line2a.x) * a) - ((line2b.y - line2a.y) * b);
		const numerator2 = ((line1b.x - line1a.x) * a) - ((line1b.y - line1a.y) * b);
		a = numerator1 / denominator;
		b = numerator2 / denominator;
		return {
			// if we cast these lines infinitely in both directions, they intersect here:
			x: line1a.x + (a * (line1b.x - line1a.x)),
			y: line1a.y + (a * (line1b.y - line1a.y)),
			/*
					// it is worth noting that this should be the same as:
					x = line2a.x + (b * (line2b.x - line2a.x));
					y = line2a.x + (b * (line2b.y - line2a.y));
					*/
			// if line1 is a segment and line2 is infinite, they intersect if:
			onLine1: a > 0 && a < 1,
			// if line2 is a segment and line1 is infinite, they intersect if:
			onLine2: b > 0 && b < 1
			// if line1 and line2 are segments, they intersect if both of the above are true
		}
	};

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
			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}

		return array;
	}

	export function flatten<T>(array: T[][]): T[] {
		return array.reduce((a, b) => a.concat(b), []);
	}

	export function randomChoice<T>(array: T[]): T {
		return array[(Math.random() * array.length) | 0];
	}

	export function lineCenter(p: Point, q: Point) {
		return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
	}

	export function linePerpendicular(p: Point, q: Point) {
		let [dx, dy, dist] = lineDistance(p, q);
		dx /= dist, dy /= dist;
		return { x: dy, y: -dx };
	}
	export function lineDistance({x: x1, y: y1}: Point, {x: x2, y: y2}: Point) {
		let dx = x1 - x2, dy = y1 - y2;
		const dist = Math.sqrt(dx * dx + dy * dy);
		dx /= dist, dy /= dist;
		return [dx, dy, dist];
	}

	export function polygonConvex(p: Point[]) {
		console.log(p);
		const l = p.length;
		for (let i = 0; i < l; i++) {
			const p1 = p[i], p2 = p[(i + 1) % l], p3 = p[(i + 2) % l];
			if (!pointsConvex(p1, p2, p3)) return false;
		}
		return true;
	}

	export function pointsConvex({x: x0, y: y0}, {x: x1, y: y1}, {x: x2, y: y2}) {
		const dx1 = x1 - x0;
		const dy1 = y1 - y0;
		const dx2 = x2 - x1;
		const dy2 = y2 - y1;
		const zcrossproduct = dx1 * dy2 - dy1 * dx2;
		return zcrossproduct <= 0;
	}
	
	/*export function findAngle(p1: Point, p2: Point, p3: Point) {
		// invert - because of screen coordinates
		return (Math.atan2(-(p1.y - p2.y), p1.x - p2.x) - Math.atan2(-(p3.y - p2.y), p3.x - p2.x)) * 180 / Math.PI;
	}*/

	export function polygonCentroid(vertices: Point[]) {
		const l = vertices.length;
		const centroid: Point = { x: 0, y: 0 };
		let signedArea = 0.0;
		let x0 = 0.0; // Current vertex X
		let y0 = 0.0; // Current vertex Y
		let x1 = 0.0; // Next vertex X
		let y1 = 0.0; // Next vertex Y
		let a = 0.0;  // Partial signed area

		// For all vertices except last
		for (let i = 0; i < vertices.length; ++i) {
			x0 = vertices[i].x;
			y0 = vertices[i].y;
			x1 = vertices[(i + 1) % l].x;
			y1 = vertices[(i + 1) % l].y;
			a = x0 * y1 - x1 * y0;
			signedArea += a;
			centroid.x += (x0 + x1) * a;
			centroid.y += (y0 + y1) * a;
		}

		signedArea *= 0.5;
		centroid.x /= (6.0 * signedArea);
		centroid.y /= (6.0 * signedArea);

		return centroid;
	}

	export function polygonKernel(points: Point[]) {
		// find kernel of containing facet. (lul)
		const minx = points.reduce((min, p) => Math.min(min, p.x), Infinity);
		const maxx = points.reduce((max, p) => Math.max(max, p.x), -Infinity);
		const miny = points.reduce((min, p) => Math.min(min, p.y), Infinity);
		const maxy = points.reduce((max, p) => Math.max(max, p.y), -Infinity);
		const pointsForVisPoly = points.map(p => <[number, number]>[p.x, p.y]).reverse();
		const inxMap = new Map<string, number>(pointsForVisPoly.map((v, i) => <[string, number]>["" + v, i]));
		const polyIsSame = (poly: [number, number][]) => {
			if (pointsForVisPoly.length !== poly.length) return false;
			const offset = inxMap.get(poly[0] + "");
			for (let i = 0; i < poly.length; i++) {
				const p1 = poly[i];
				const p2 = pointsForVisPoly[(i + offset) % poly.length];
				if (!p2) return false;
				if (p1[0] !== p2[0] || p1[1] !== p2[1]) return false;
			}
			return true;
		}
		const segments = VisibilityPolygon.convertToSegments([pointsForVisPoly]);
		let x: number, y: number;
		console.log("searching for ",points, segments);
		while (true) {
			x = Math.random() * (maxx - minx) + minx;
			y = Math.random() * (maxy - miny) + miny;
			if (VisibilityPolygon.inPolygon([x, y], pointsForVisPoly)) {
				try {
					if (polyIsSame(VisibilityPolygon.compute([x, y], segments))) break;
				} catch(e) {
					// sometimes fails when point to close to edge
					continue;
				}
			}
		}
		return { x: x, y: y };
	}

}
