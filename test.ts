let sigmaInstance: SigmaJs.Sigma;

class Edge {
	constructor(public v1: Vertex, public v2: Vertex) { }
	get id() {
		return `e${this.v1.id}-${this.v2.id}`;
	}
	static unordered(v1: Vertex, v2: Vertex) {
		if (v1.id > v2.id) {
			return new Edge(v2, v1);
		}
		return new Edge(v1, v2);
	}
	static ordered(v1: Vertex, v2: Vertex) {
		return new Edge(v1, v2);
	}
}

class Vertex {
	private static counter = 0;
	id: number;
	get sigmaId() { return "" + this.id }
	edges = new Set<Vertex>();
	constructor() {
		this.id = Vertex.counter++;
	}
}
function union<T>(s1: Set<T>, s2: Set<T>) {
	return new Set([...s1, ...s2]);
}
function intersection<T>(s1: Set<T>, s2: Set<T>) {
	return new Set([...s1].filter(x => s2.has(x)));
}
/**  A \ B */
function difference<T>(s1: Set<T>, s2: Set<T>) {
	return new Set([...s1].filter(x => !s2.has(x)));
}
class Graph {
	constructor(public V: Set<Vertex> = new Set<Vertex>(), public E: Set<Edge> = new Set<Edge>()) { }

	subgraph(subV: Set<Vertex>) {
		return new Graph(subV, new Set(this.E));
	}
	union(g2: Graph) {
		return new Graph(union(this.V, g2.V), union(this.E, g2.E));
	}
	getEdges(v: Vertex) {
		return intersection(v.edges, this.V);
	}
	getAllEdges() {
		const out = new ActualSet<Edge>(e => e.id);
		for (let v1 of this.V) for (let v2 of this.getEdges(v1)) {
			const e = Edge.unordered(v1, v2);
			if (!out.has(e)) out.add(e);
		}
		return out;
	}
	getRandomVertex() {
		return this.V.values().next().value;
	}
	toSigma(): SigmaJs.GraphData {
		const nodes: SigmaJs.Node[] = [...this.V].map(v => ({ id: "" + v.id, x: Math.random(), y: Math.random(), size: 1 }));
		const edges: SigmaJs.Edge[] = [];
		for (let e of this.getAllEdges()) {
			edges.push({ id: e.id, source: `${e.v1.id}`, target: `${e.v2.id}` });
		}
		return { nodes: nodes, edges: edges };
	}
	draw() {
		const s = this.toSigma();
		(<any>sigmaInstance.graph).read(s);
		sigmaInstance.configForceAtlas2({ slowDown: 1 });
		sigmaInstance.startForceAtlas2();
		setTimeout(() => sigmaInstance.stopForceAtlas2(), 2000);
	}
	static randomGraph(N = 10, E = 15) {
		const verts: Vertex[] = [];
		for (let i = 0; i < N; i++) verts.push(new Vertex());
		const edges = new ActualSet<Edge>(e => e.id);
		for (let i = 0; i < E; i++) {
			let e: Edge;
			do {
				const v1 = Math.random() * N | 0;
				const v2 = Math.random() * N | 0;
				e = Edge.unordered(verts[v1], verts[v2]);
			} while (edges.has(e));
			edges.add(e);
			e.v1.edges.add(e.v2); e.v2.edges.add(e.v1);
		}
		return new Graph(new Set(verts.filter(v => v.edges.size > 0)), edges);
	}

	static K(n: number) {
		const vertices: Vertex[] = [];
		for (let i = 0; i < n; i++) vertices.push(new Vertex());
		for (let i = 0; i < n; i++) vertices[i].edges = new Set(vertices);
		const edges: Set<Edge> = new ActualSet<Edge>(e => e.id);
		for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i != j) edges.add(Edge.unordered(vertices[i], vertices[j]));
		return new Graph(new Set(vertices), edges);
	}
}
class Tree<T> {
	constructor(public value: T, public children: Tree<T>[] = []) { }
	preOrder(fn: (t: Tree<T>, parent: Tree<T>, layer: number, childIndex: number) => any, layer = 0, parent: Tree<T> = null, childIndex = 0) {
		fn(this, parent, layer, childIndex);
		for (let i = 0; i < this.children.length; i++) this.children[i].preOrder(fn, layer + 1, this, i);
	}
	get depth(): number {
		if (this.children.length == 0) return 1;
		return 1 + Math.max(...this.children.map(c => c.depth));
	}
	toArray() {
		let layers: [T, T][][] = new Array(this.depth);

		function add(t: Tree<T>, parent: Tree<T>, layer: number, childIndex: number) {
			if (!layers[layer]) layers[layer] = [];
			layers[layer].push([t.value, parent ? parent.value : null]);
		}
		this.preOrder(add);
		return layers;
	}
}


function BFS(G: Graph, root: Vertex = G.V.values().next().value) {
	let rootTree = new Tree(root);
	let visited = new Set<Vertex>([root]);
	const queue: Tree<Vertex>[] = [rootTree];
	while (queue.length > 0) {
		const v = queue.shift();
		for (let child of G.getEdges(v.value)) {
			if (visited.has(child)) continue;
			const t = new Tree(child);
			v.children.push(t);
			queue.push(t);
			visited.add(child);
		}
	}
	return rootTree;
}
function reposition(edges: Map<Vertex, { x: number, y: number }>) {
	const nodes = sigmaInstance.graph.nodes();
	const ys = nodes.map(n => n.y), xs = nodes.map(n => n.x);
	const miny = Math.min(...ys), maxy = Math.max(...ys);
	const minx = Math.min(...xs), maxx = Math.max(...xs);
	for (const [vertex, {x, y}] of edges) {
		const node = sigmaInstance.graph.nodes(vertex.sigmaId);
		node.x = (maxx - minx) * x + minx;
		node.y = (maxy - miny) * y + miny;
	}
}
function highlight(edges: Set<Edge>) {
	for (let _edge of edges) {
		const edge = sigmaInstance.graph.edges(_edge.id);
		edge.color = "#ff0000";
		edge.size = 6;
	}
}
function visualizeBFS(G: Graph) {
	const tree = BFS(G);
	let color = 0;
	sigmaInstance.stopForceAtlas2();
	let layers: [Vertex, Vertex][][] = tree.toArray();

	const repos = new Map<Vertex, { x: number, y: number }>();
	const highlights = new Set<Edge>();
	for (let i = 0; i < layers.length; i++) {
		const l = layers[i];
		for (let n = 0; n < l.length; n++) {
			const [vertex, parent] = l[n];
			repos.set(vertex, { x: (n + 1) / (parent == null ? 2 : l.length + 1), y: i / layers.length });
			if (parent == null) continue;
			highlights.add(Edge.unordered(parent, vertex));
		}
	}
	reposition(repos); highlight(highlights);
	sigmaInstance.refresh();
}
function PST(G: Graph): { v1: Set<Vertex>, v2: Set<Vertex>, s: Set<Vertex> } {
	const tree = BFS(G, G.getRandomVertex());
	return null;
}
function matching(G: Graph): Edge[] {
	if (G.V.size >= 5) {
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

let g: Graph;
function init() {
	sigmaInstance = new sigma('graph-container');

	g = Graph.randomGraph(30, 60);
	g.draw();
	setTimeout(() => visualizeBFS(g), 2000);
}

document.addEventListener('DOMContentLoaded', init);
