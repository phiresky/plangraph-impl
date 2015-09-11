let sigmainst: SigmaJs.Sigma, g: Graph;

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
		return e.id;
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
		return v.sigmaId;
	}
	toString = () => this.sigmaId;
}
class Graph {
	protected V: Set<Vertex>;
	get n() { return this.V.size; }
	protected E: Map<Vertex, Vertex[]>;
	get m() { return this.E.size; }
	private positionMap: (v: Vertex) => Point;
	constructor(V: Iterable<Vertex> = [], E: Iterable<[Vertex, Vertex[]]> = []) {
		this.V = new ActualSet<Vertex>(Vertex, V);
		this.E = new Map<Vertex, Vertex[]>(E);
		for (const v of this.V) if (!this.E.has(v)) this.E.set(v, []);
	}

	subgraph(subV: Set<Vertex>) {
		return new Graph(subV, new ActualSet(Edge, this.E));
	}
	union(g2: Graph) {
		return new Graph(new ActualSet(Vertex, [...this.V, ...g2.V]), new Map([...this.E, ...g2.E]));
	}
	hasEdgeUndirected(v: Vertex, to: Vertex) {
		if (this.getEdgesUndirected(v).indexOf(to) >= 0 && this.getEdgesUndirected(to).indexOf(v) >= 0) return true;
		else return false;
	}
	addEdgeUndirected(from: Vertex, to: Vertex) {
		console.log(`adding (${from},${to})`);
		if (this.hasEdgeUndirected(from, to)) throw `${from} to ${to} already exists`;
		this.getEdgesUndirected(from).push(to);
		this.getEdgesUndirected(to).push(from);
	}
	getEdgesUndirected(v: Vertex) {
		if (!this.V.has(v)) throw `graph does not contain ${v}`;
		return this.E.get(v);
	}
	getAllEdgesUndirected() {
		const out = new ActualSet<Edge>(Edge);
		for (let v1 of this.V) for (let v2 of this.getEdgesUndirected(v1)) {
			const e = Edge.undirected(v1, v2);
			if (!out.has(e)) out.add(e);
		}
		return out;
	}
	getVertices(): Iterable<Vertex> {
		return this.V;
	}
	getRandomVertex() {
		return this.V.values().next().value;
	}
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
	draw() {
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
		if (data[0].length == 0) data.shift();
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
		const Θ = ([v1, v2]: E) => this.getNextEdge(v1, v2);
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
				this.addEdgeUndirected(t(é), t(e), v, t(this.getPrevEdge(t(e), v)));
				return;
			}
			// todo: sonderfall
			const eneu: E = [s(é), t(é́)];
			this.addEdgeUndirected(s(eneu), t(eneu), t(this.getPrevEdge(s(eneu), t(é))), t(é));
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

	getEdgeIndex(v1: Vertex, v2: Vertex): number {
		const edges = this.getEdgesUndirected(v1);
		for (let i = 0; i < edges.length; i++) {
			if (edges[i] === v2) return i;
		}
		throw `(${v1},${v2}) does not exist`;
	}
	getNextEdge(v1: Vertex, v2: Vertex): [Vertex, Vertex] {
		if (!this.hasEdgeUndirected(v1, v2)) throw "not an edge";
		const edges = this.getEdgesUndirected(v1);
		let nextEdge = (this.getEdgeIndex(v1, v2) + 1) % edges.length;
		return [v1, edges[nextEdge]];
	}
	getPrevEdge(v1: Vertex, v2: Vertex): [Vertex, Vertex] {
		if (!this.hasEdgeUndirected(v1, v2)) throw "not an edge";
		const edges = this.getEdgesUndirected(v1);
		let nextEdge = (this.getEdgeIndex(v1, v2) - 1 + edges.length) % edges.length;
		return [v1, edges[nextEdge]];
	}
	addEdgeUndirected(from: Vertex, to: Vertex, afterEdge1?: Vertex, afterEdge2?: Vertex) {
		console.log(`adding (${from},${to}) after ${from},${afterEdge1} and ${to},${afterEdge2}`);
		if (this.hasEdgeUndirected(from, to)) throw `${from} to ${to} already exists`;
		if (afterEdge1 === undefined) {
			this.getEdgesUndirected(from).push(to);
			this.getEdgesUndirected(to).push(from);
		} else {
			const index1 = this.getEdgeIndex(from, afterEdge1);
			const edges1 = this.getEdgesUndirected(from);
			edges1.splice(index1 + 1, 0, to);
			const index2 = this.getEdgeIndex(to, afterEdge2);
			const edges2 = this.getEdgesUndirected(to);
			edges2.splice(index2 + 1, 0, from);
		}
	}

	static randomPlanarGraph(n: number) {
		const positionMap = new Map<Vertex, Point>();
		const toPos: (v: Vertex) => Point = positionMap.get.bind(positionMap);

		const V: Vertex[] = Util.array(n, i => new Vertex());
		const E: [Vertex, Vertex][] = [];
		const G = new PlanarGraph(V);
		for (let v of V) positionMap.set(v, { x: Math.random(), y: Math.random() });

		function addPlanarLink(edge: [Vertex, Vertex], links: [Vertex, Vertex][]) {
			if (!links.some(other => Util.intersect([toPos(edge[0]), toPos(edge[1])], [toPos(other[0]), toPos(other[1])])))
				E.push(edge);
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

class Tree<T> {
	constructor(public element: T, public children: Tree<T>[] = []) { }
	preOrder(fn: (t: Tree<T>, parent: Tree<T>, layer: number, childIndex: number) => any, layer = 0, parent: Tree<T> = null, childIndex = 0) {
		fn(this, parent, layer, childIndex);
		for (let i = 0; i < this.children.length; i++) this.children[i].preOrder(fn, layer + 1, this, i);
	}
	get depth(): number {
		if (this.children.length == 0) return 1;
		return 1 + Math.max(...this.children.map(c => c.depth));
	}
	toArray() {
		let layers: { element: T, parent: T }[][] = new Array(this.depth);

		function add(t: Tree<T>, parent: Tree<T>, layer: number, childIndex: number) {
			if (!layers[layer]) layers[layer] = [];
			layers[layer].push({ element: t.element, parent: parent ? parent.element : null });
		}
		this.preOrder(add);
		return layers;
	}
}

class BFS {
	constructor(public tree: Tree<Vertex>) { }

	private _treeLayers: { element: Vertex, parent: Vertex }[][];
	get treeLayers() {
		if (this._treeLayers === undefined) this._treeLayers = this.tree.toArray();
		return this._treeLayers;
	}
	static run(G: Graph, root: Vertex = G.getRandomVertex()) {
		let rootTree = new Tree(root);
		let visited = new Set<Vertex>([root]);
		const queue: Tree<Vertex>[] = [rootTree];
		while (queue.length > 0) {
			const v = queue.shift();
			for (let child of G.getEdgesUndirected(v.element)) {
				if (visited.has(child)) continue;
				const t = new Tree(child);
				v.children.push(t);
				queue.push(t);
				visited.add(child);
			}
		}
		return new BFS(rootTree);
	}
	getTreeOrderPositions() {
		const layers = this.treeLayers;
		const repos = new Map<Vertex, { x: number, y: number }>();
		for (let [i, layer] of layers.entries()) {
			for (let [n, {element, parent}] of layer.entries())
				repos.set(element, { x: (n + 1) / (parent == null ? 2 : layer.length + 1), y: i / layers.length });
		}
		return repos;
	}
	getUsedEdges() {
		const edges = new ActualSet<Edge>(Edge);
		for (const layer of this.treeLayers) for (const {element, parent} of layer) {
			if (parent == null) continue;
			edges.add(Edge.undirected(parent, element));
		}
		return edges;
	}
}
function addPositions(prefix: string, posMap: Iterable<[Vertex, { x: number, y: number }]>) {
	const nodes = sigmainst.graph.nodes();
	const ys = nodes.map(n => n.y), xs = nodes.map(n => n.x);
	for (const [vertex, {x, y}] of posMap) {
		const node = sigmainst.graph.nodes(vertex.sigmaId);
		node[prefix + "_x"] = x;
		node[prefix + "_y"] = y;
	}
}
function animatePositions(prefix: string) {
	sigma.plugins.animate(sigmainst, {
		x: prefix + '_x', y: prefix + '_y'
	}, {
			easing: 'cubicInOut',
			duration: 1000
		});
}
function highlight(g: Graph, edges: Set<Edge>, color = "#ff0000") {
	for (const _edge of g.getAllEdgesUndirected()) {
		const edge = sigmainst.graph.edges(_edge.id);
		if (edges.has(_edge)) {
			edge.color = color;
			edge.size = 6;
		} else {
			edge.color = "#000000";
			edge.size = undefined;
		}
	}
}
function resetPositions(G: Graph) {
	animatePositions("original");
}
function PST(G: Graph): { v1: Set<Vertex>, v2: Set<Vertex>, s: Set<Vertex> } {
	const tree = BFS.run(G, G.getRandomVertex());
	return null;
}
function matching(G: Graph): Edge[] {
	if (G.n >= 5) {
		const {v1, v2, s} = PST(G);
		const g1 = G.subgraph(v1), g2 = G.subgraph(v2);
		const m1 = matching(g1), m2 = matching(g2);
		const m = m1.concat(m2);
		const g = g1.union(g2);
		for (const v of s) {
			// g.V. finde erhöhenden weg etc
		}
		return m;
	}
	return null;
}

const Macros = {
	bfsPositions: () => {
		addPositions('bfs', BFS.run(g).getTreeOrderPositions()); animatePositions('bfs');
	},
	bfsHighlights: () => {
		highlight(g, BFS.run(g).getUsedEdges());
		sigmainst.refresh();
	},
	noHighlights: () => {
		highlight(g, new Set<Edge>());
		sigmainst.refresh();
	},
	newRandomPlanarGraph: () => {
		sigmainst.graph.clear();
		g = PlanarGraph.randomPlanarGraph(30);
		g.draw();
	},
	testAGraph: () => {
		return Graph.fromAscii(
			`
         1

2

         3`, [1, 2, 3]);
	},
	testBGraph: () => {
		return Graph.fromAscii(
			`
     1

     2

3        4`, [1, 2, 3], [2, 4]);
	},
	testCGraph: () => {
		return Graph.fromAscii(
			`
1  2

3  4`, [1, 2, 4, 3, 1], [2, 3]);
	},
	testDGraph: () => {
		return Graph.fromAscii(
			`
1  2  3

4  5  6  7

  8  9`, [1, 2, 3, 6, 5, 4, 1], [2, 5, 3], [7, 6, 9, 8, 4]);
	}
}

function init() {
	sigmainst = new sigma('graph-container');
	Macros.newRandomPlanarGraph();
}

document.addEventListener('DOMContentLoaded', init);

interface Point {
	x: number; y: number;
}

