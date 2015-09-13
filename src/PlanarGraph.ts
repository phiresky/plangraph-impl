class Edge {
	constructor(public v1: Vertex, public v2: Vertex) { }
	get id() {
		return `e${this.v1.id}-${this.v2.id}`;
	}
	static undirected(v1: Vertex, v2: Vertex) {
		if (v1.id > v2.id) {
			return new Edge(v2, v1);
		}
		return new Edge(v1, v2);
	}
	static ordered(v1: Vertex, v2: Vertex) {
		return new Edge(v1, v2);
	}
	toString = () => this.id;
	static [ActualSet.hash](e: Edge) {
		if (!(e instanceof Edge)) throw new Error("assertion error");
		return e.id;
	}
	static Set(...e: Edge[]) {
		return new ActualSet(Edge, e);
	}
}

class Vertex {
	private static counter = 0;
	id: number;
	get sigmaId() { return "" + this.id }
	constructor() {
		this.id = Vertex.counter++;
	}
	static [ActualSet.hash](v: Vertex) {
		if (!(v instanceof Vertex)) throw new Error("assertion error");
		return v.sigmaId;
	}
	toString = () => this.sigmaId;
	static Set(...v: Vertex[]) {
		return new ActualSet(Vertex, v);
	}
}
class Graph {
	protected V: Set<Vertex>;
	get n() { return this.V.size; }
	protected E: Map<Vertex, Vertex[]>;
	get m() { return this.E.size; }
	private positionMap: (v: Vertex) => Point;
	constructor(V: Iterable<Vertex> = [], E: Iterable<[Vertex, Vertex[]]> = []) {
		this.V = Vertex.Set(...V);
		this.E = new Map<Vertex, Vertex[]>(E);
		for (const v of this.V) if (!this.E.has(v)) this.E.set(v, []);
	}

	subgraph(subV: Iterable<Vertex>) {
		return new Graph(subV, new Map(this.E));
	}
	union(g2: Graph) {
		return new Graph(Vertex.Set(...[...this.V, ...g2.V]), new Map([...this.E, ...g2.E]));
	}
	hasEdgeUndirected(v: Vertex, to: Vertex) {
		if (this.getEdgesUndirected(v).indexOf(to) >= 0 && this.getEdgesUndirected(to).indexOf(v) >= 0) return true;
		else return false;
	}
	addVertex(v: Vertex) {
		this.V.add(v);
		if(!this.E.has(v)) this.E.set(v, []);
	}
	addEdgeUndirected(from: Vertex, to: Vertex) {
		console.log(`adding (${from},${to})`);
		if (this.hasEdgeUndirected(from, to)) throw `${from} to ${to} already exists`;
		this.getEdgesUndirected(from).push(to);
		this.getEdgesUndirected(to).push(from);
	}
	getEdgesUndirected(v: Vertex) {
		if (!v || !this.V.has(v)) throw new Error(`graph does not contain ${v}`);
		return this.E.get(v);
	}
	getAllEdgesUndirected() {
		const out = Edge.Set();
		for (let v1 of this.V) for (let v2 of this.getEdgesUndirected(v1)) {
			const e = Edge.undirected(v1, v2);
			if (!out.has(e)) out.add(e);
		}
		return out;
	}
	getVertices(): Iterable<Vertex> {
		return this.V;
	}
	getSomeVertex() {
		return this.V.values().next().value;
	}
	getRandomVertex() {
		return Util.randomChoice([...this.V]);
	}
	getVertexById(id:number):Vertex {
		for(let v of this.V) if(v.id === id) return v;
		return null;
	}

	getEdgeIndex(v1: Vertex, v2: Vertex): number {
		const edges = this.getEdgesUndirected(v1);
		for (let i = 0; i < edges.length; i++) {
			if (edges[i] === v2) return i;
		}
		throw `(${v1},${v2}) does not exist`;
	}
	removeEdgeUndirected(v1:Vertex, v2:Vertex) {
		this.getEdgesUndirected(v1).splice(this.getEdgeIndex(v1, v2), 1);
		this.getEdgesUndirected(v2).splice(this.getEdgeIndex(v2, v1), 1);
	}
	/*removeVertex(v: Vertex) {
		this.V.delete(v);
		// todo
	}*/
	sortEdges(mapper: (v1: Vertex, v2: Vertex) => number) {
		for (let v1 of this.V) this.E.set(v1, this.E.get(v1).sort((v2a, v2b) => mapper(v1, v2a) - mapper(v1, v2b)));
	}
	setPositionMap(map: (V: Vertex) => Point) {
		this.positionMap = map;
		console.log("bef");
		//for(var e of this.E) console.log(e[0]+" -> "+e[1])
		this.sortEdges((v1, v2) => {
			const [p1, p2] = [map(v1), map(v2)];
			const angle = - Math.atan2(p2.y - p1.y, p2.x - p1.x); // counter clockwise
			// console.log(`angle between ${v1} and ${v2} is ${angle*180/Math.PI}`);
			return angle;
		});
		//for(var e of this.E) console.log(e[0]+" -> "+e[1])
	}
	toSigma(): SigmaJs.GraphData {
		const posMap = this.positionMap || (v => ({ x: Math.random(), y: Math.random() }));
		const nodes: SigmaJs.Node[] = [...this.V].map(v => {
			const pos = posMap(v);
			return { id: "" + v.id, x: pos.x, y: pos.y, original_x: pos.x, original_y: pos.y, size: 1, label: "" + v.id }
		});
		const edges: SigmaJs.Edge[] = [];
		for (let e of this.getAllEdgesUndirected()) {
			edges.push({ id: e.id, source: `${e.v1.id}`, target: `${e.v2.id}` });
		}
		return { nodes: nodes, edges: edges };
	}
	draw(sigmainst: SigmaJs.Sigma) {
		const s = this.toSigma();
		sigmainst.graph.read(s);
		sigmainst.refresh();
		if (!this.positionMap) {
			sigmainst.configForceAtlas2({ slowDown: 1 });
			sigmainst.startForceAtlas2();
			setTimeout(() => sigmainst.stopForceAtlas2(), 2000);
		}
	}
	static randomGraph(n = 10, m = 15) {
		const verts: Vertex[] = [];
		for (let i = 0; i < n; i++) verts.push(new Vertex());
		const g = new Graph(verts);

		for (let i = 0; i < m; i++) {
			let e: Edge;
			let v1: number, v2: number;
			do {
				v1 = Math.random() * n | 0;
				v2 = Math.random() * n | 0;
			} while (g.hasEdgeUndirected(verts[v1], verts[v2]));
			g.addEdgeUndirected(verts[v1], verts[v2]);
		}
		return g;
	}

	/** complete graph of size n */
	static K(n: number) {
		const vertices: Vertex[] = [];
		for (let i = 0; i < n; i++) vertices.push(new Vertex());
		const g = new Graph(new Set(vertices));
		for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i != j) g.addEdgeUndirected(vertices[i], vertices[j]);
	}

	static fromAscii(ascii: string, ...edges: number[][]) {
		const data = ascii.split('\n');
		while (data[0].length == 0 || data[0].match(/_+/)) data.shift();
		const toPos = new Map<Vertex, Point>();
		const V: Vertex[] = [];
		for (let [y, line] of data.entries()) {
			for (let [x, char] of line.split('').entries()) {
				if (char.match(/\d/) !== null) {
					const v = new Vertex();
					const id = +char;
					V[id] = v;
					console.log(id, x, y);
					toPos.set(v, { x: x, y: y });
				}
			}
		}
		const G = new PlanarGraph(V.filter(v => v != null));
		for (let path of edges) {
			for (let i = 0; i < path.length - 1; i++)
				G.addEdgeUndirected(V[path[i]], V[path[i + 1]]);
		}
		G.setPositionMap(toPos.get.bind(toPos));
		return G;
	}
}
class PlanarGraph extends Graph {
	constructor(V: Iterable<Vertex> = [], E: Iterable<[Vertex, Vertex[]]> = []) {
		super(V, E);
	}

	triangulateAll(): Graph {
		type E = [Vertex, Vertex];
		const invert = ([v1, v2]: E) => <E>[v2, v1];
		const Θ = ([v1, v2]: E) => <E>[v1, this.getNextEdge(v1, v2)];
		const Θstar = (e: E) => Θ(invert(e));
		const s = ([s, t]: E) => s, t = ([s, t]: E) => t;
		const equal = ([s1, t1]: E, [s2, t2]: E) => s1 === s2 && t1 === t2;
		const triangulate = (e: E, é: E) => {
			if (equal(e, é)) return;
			console.log(`triangulating ${e} and ${é}`);
			if (s(e) !== s(é)) throw "assertion error";
			const v = s(e);
			const é́ = Θstar(é);
			if (equal(Θstar(é́), invert(e))) return; // already triangular
			if (this.hasEdgeUndirected(v, t(é́)) || t(é́) === v) {
				this.addEdgeUndirected(t(é), t(e), v, this.getPrevEdge(t(e), v));
				return;
			}
			// todo: sonderfall
			const eneu: E = [s(é), t(é́)];
			this.addEdgeUndirected(s(eneu), t(eneu), this.getPrevEdge(s(eneu), t(é)), t(é));
			triangulate(e, eneu);
		}
		for (const v of Util.shuffle([...this.V])) {
			for (const v2 of this.getEdgesUndirected(v)) {
				if (v === v2) continue;
				const e: E = [v, v2];
				const é = Θ(e);
				triangulate(e, é);
			}
		}
		return this;
	}

	*getNextEdges(v1: Vertex, v2: Vertex) {
		let v2start = v2;
		v2 = this.getNextEdge(v1, v2);
		while(v2 !== v2start) {
			yield v2;
			v2 = this.getNextEdge(v1, v2)
		}
	}
	getNextEdge(v1: Vertex, v2: Vertex): Vertex {
		if (!this.hasEdgeUndirected(v1, v2)) throw new Error(`does not have edge ${v1} - ${v2}`);
		const edges = this.getEdgesUndirected(v1);
		let nextEdge = (this.getEdgeIndex(v1, v2) + 1) % edges.length;
		return edges[nextEdge];
	}
	getPrevEdge(v1: Vertex, v2: Vertex): Vertex {
		if (!this.hasEdgeUndirected(v1, v2)) throw new Error(`does not have edge ${v1} - ${v2}`);
		const edges = this.getEdgesUndirected(v1);
		let nextEdge = (this.getEdgeIndex(v1, v2) - 1 + edges.length) % edges.length;
		return edges[nextEdge];
	}
	*getEdgesBetween(vbefore: Vertex, vref: Vertex, vafter: Vertex) {
		if (!this.hasEdgeUndirected(vref, vafter)) throw new Error(`does not have edge ${vref} - ${vafter}`);
		if (vafter === vbefore) throw new Error("same edge");
		let edge = this.getNextEdge(vref, vbefore);
		while (edge !== vafter) {
			yield edge;
			edge = this.getNextEdge(vref, edge);
		}
	}
	edgeIsBetween(base: Vertex, target: Vertex, rightEdge: Vertex, leftEdge: Vertex) {
		for(let edge of this.getEdgesBetween(rightEdge, base, leftEdge))
			if(edge === target) return true;
		return false;
	}
	addEdgeUndirected(from: Vertex, to: Vertex, afterEdge1?: Vertex, afterEdge2?: Vertex) {
		console.log(`adding (${from},${to}) after ${from},${afterEdge1} and ${to},${afterEdge2}`);
		if (this.hasEdgeUndirected(from, to)) throw `${from} to ${to} already exists`;
		if (afterEdge1 === undefined && afterEdge2 === undefined) {
			this.getEdgesUndirected(from).push(to);
			this.getEdgesUndirected(to).push(from);
		} else {
			const edges1 = this.getEdgesUndirected(from);
			const index1 = afterEdge1 === undefined ? edges1.length - 1 : this.getEdgeIndex(from, afterEdge1);
			edges1.splice(index1 + 1, 0, to);
			const edges2 = this.getEdgesUndirected(to);
			const index2 = afterEdge2 === undefined ? edges2.length - 1 : this.getEdgeIndex(to, afterEdge2);
			edges2.splice(index2 + 1, 0, from);
		}
		console.log(`${from}: ${this.getEdgesUndirected(from)}, ${to}: ${this.getEdgesUndirected(to)}`);
	}
	*facetsAround(v: Vertex) {
		for(let v2 of this.getEdgesUndirected(v)) {
			const facet = [v, v2];
			while(facet[facet.length-1] !== v) facet.push(this.getPrevEdge(facet[facet.length-1], facet[facet.length-2]));
			facet.pop();//no duplicate point
			yield facet;
		}
	}

	checkTriangulated() {
		const has = (v1: Vertex, v2: Vertex) => this.hasEdgeUndirected(v1, v2);
		for (const v1 of this.getVertices()) {
			for (const v2 of this.getEdgesUndirected(v1)) {
				const v3 = this.getNextEdge(v1, v2);
				if (!has(v1, v3) || this.getPrevEdge(v1, v3) !== v2) return false;

				if (!has(v2, v3) || this.getNextEdge(v2, v3) !== v1) return false;
				if (!has(v2, v1) || this.getPrevEdge(v2, v1) !== v3) return false;

				if (!has(v3, v1) || this.getNextEdge(v3, v1) !== v2) return false;
				if (!has(v3, v2) || this.getPrevEdge(v3, v2) !== v1) return false;
			}
		}
		return true;
	}
	
	clone() {
		const e = [...this.E];
		for(const x of e) x[1] = x[1].slice(); // clone edge arrays
		return new PlanarGraph(this.V, e);
	}

	static randomPlanarGraph(n: number) {
		const positionMap = new Map<Vertex, Point>();
		const toPos: (v: Vertex) => Point = positionMap.get.bind(positionMap);

		const V: Vertex[] = Util.array(n, i => new Vertex());
		const E: ActualSet<[Vertex, Vertex]> = new ActualSet(([v1, v2]: [Vertex, Vertex]) => v1.id + "|" + v2.id);
		const G = new PlanarGraph(V);
		for (let v of V) positionMap.set(v, { x: Math.random(), y: Math.random() });

		function addPlanarLink(edge: [Vertex, Vertex], links: ActualSet<[Vertex, Vertex]>) {
			if (!links.has(edge) &&
				edge[0] !== edge[1] &&
				!links.some(other => Util.intersect([toPos(edge[0]), toPos(edge[1])], [toPos(other[0]), toPos(other[1])])))
				E.add(edge);
		}
		for (const point of V) addPlanarLink([point, V[(Math.random() * n) | 0]], E);
		for (let i = 0; i < n; i++) {
			for (let j = 1 + 1; j < n; j++) addPlanarLink([V[i], V[j]], E);
		}
		for (const [v1, v2] of E) G.addEdgeUndirected(v1, v2);
		G.setPositionMap(toPos);
		return G;
	}
}