let sigmainst: SigmaJs.Sigma, g: PlanarGraph;

type StepByStepAlgorithm<T> = IterableIterator<StepByStepState<T>>;
type Highlights<T> = Iterable<{ set: ActualSet<T>, color: string }>;
interface StepByStepState<FinalResult> {
	resetEdgeHighlights?: string;
	resetNodeHighlights?: string;
	newEdgeHighlights?: Highlights<Edge>,
	newNodeHighlights?: Highlights<Vertex>,
	changePositions?: Map<Vertex, Point>,
	/** undefined if not done */
	finalResult?: FinalResult
}

const Color = {
	PrimaryHighlight: "#ff0000",
	SecondaryHighlight: "#00ff00",
	TertiaryHighlight: "#0000ff",
	Normal: "#000000",
	GrayedOut: "#999999"
}
class GraphAlgorithm {
	constructor(public name: string, public supplier: () => StepByStepAlgorithm<any>) {

	}
}

const Algorithms = [
	new GraphAlgorithm("Breadth First Search", () => BFS.run(g)),
	new GraphAlgorithm("Tree Lemma (Separator ≤ 2h + 1)", () => treeLemma(g, StepByStep.complete(BFS.run(g)))),
	new GraphAlgorithm("Find embedding", () => findPlanarEmbedding(g))
];

module GUI {
	export let currentAlgorithm: StepByStepAlgorithm<any> = null;
	let interval: number = undefined;
	export function algorithmStep() {
		if (currentAlgorithm) {
			if (StepByStep.step(currentAlgorithm)) {
				onAlgorithmFinish();
			}
		} else {
			onAlgorithmFinish();
		}
	}
	export function onAlgorithmFinish() {
		$("#stepButton").prop("disabled", true);
		$("#runButton").prop("disabled", true);
		if (interval !== undefined) {
			$("#runButton").text("Run");
			clearInterval(interval);
		}
	}
	export function algorithmRunToggle() {
		const btn = $("#runButton");
		if (interval !== undefined) {
			btn.text("Run");
			clearInterval(interval);
		} else {
			btn.text("Stop");
			interval = setInterval(() => algorithmStep(), 10000 / g.n);
		}
	}
	export function startAlgorithm() {
		const select = <HTMLSelectElement>$("#selectAlgorithm")[0];
		const algo = Algorithms[+select.value];
		$("#stepButton").prop("disabled", false);
		$("#runButton").prop("disabled", false);
		currentAlgorithm = algo.supplier();
		algorithmStep();
	}

	export const Macros = {
		bfsPositions: () => {
			addPositions('bfs', StepByStep.complete(BFS.run(g)).getTreeOrderPositions()); animatePositions('bfs');
		},
		bfsHighlights: () => {
			highlightEdges(g, "#000000", { set: StepByStep.complete(BFS.run(g)).getUsedEdges(), color: Color.PrimaryHighlight });
			sigmainst.refresh();
		},
		noHighlights: () => {
			highlightEdges(g, "#000000");
			sigmainst.refresh();
		},
		newRandomPlanarGraph: () => {
			sigmainst.graph.clear();
			g = PlanarGraph.randomPlanarGraph(+(<HTMLInputElement>document.getElementById("vertexCount")).value);
			g.draw(sigmainst);
		}
	}

	export function init() {
		sigmainst = new sigma('graph-container');
		Macros.newRandomPlanarGraph();
		const select = <HTMLSelectElement>$("#selectAlgorithm")[0];
		for (let [i, algo] of Algorithms.entries()) {
			select.add(new Option(algo.name, i + "", i === 0));
		}
	}

}
class StepByStep {
	static step<T>(algo: StepByStepAlgorithm<T>): boolean {
		const next = algo.next();
		if (next.done) return true;
		StepByStep.applyState(next.value);
		return next.value.finalResult !== undefined;
	}
	static complete<T>(algo: StepByStepAlgorithm<T>): T {
		for (const state of algo) {
			if (state.finalResult !== undefined) return state.finalResult;
		}
		throw "did not get final result"
	}
	static applyState(state: StepByStepState<any>) {
		highlightEdges(g, state.resetEdgeHighlights, ...(state.newEdgeHighlights || []));
		highlightVertices(g, state.resetNodeHighlights, ...(state.newNodeHighlights || []));
		if(state.changePositions !== undefined) {
			addPositions("_temp", state.changePositions);
			animatePositions("_temp", [...state.changePositions.keys()].map(v => v.sigmaId));
		}
		sigmainst.refresh();
	}
}

interface TreeVisitor<T> {
	(t: Tree<T>, parent: Tree<T>, layer: number, childIndex: number): any;
}
class Tree<T> {
	constructor(public element: T, public children: Tree<T>[] = []) { }
	preOrder(fn: TreeVisitor<T>, parent: Tree<T> = null, layer = 0, childIndex = 0) {
		fn(this, parent, layer, childIndex);
		for (let [i, child] of this.children.entries()) child.preOrder(fn, this, layer + 1, i);
	}
	postOrder(fn: TreeVisitor<T>, parent: Tree<T> = null, layer = 0, childIndex = 0) {
		for (let [i, child] of this.children.entries()) child.postOrder(fn, this, layer + 1, i);
		fn(this, parent, layer, childIndex);
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
	constructor(public tree: Tree<Vertex>/*, public usedEdges: ActualSet<Edge>*/) { }

	private _treeLayers: { element: Vertex, parent: Vertex }[][];
	get treeLayers() {
		if (this._treeLayers === undefined) this._treeLayers = this.tree.toArray();
		return this._treeLayers;
	}
	static *run(G: Graph, root: Vertex = G.getSomeVertex()): StepByStepAlgorithm<BFS> {
		let rootTree = new Tree(root);
		let visited = Vertex.Set(root);
		const queue: Tree<Vertex>[] = [rootTree];
		const usedEdges = Edge.Set();
		while (queue.length > 0) {
			const v = queue.shift();
			const currentChildren = Edge.Set();
			for (let child of G.getEdgesUndirected(v.element)) {
				if (visited.has(child)) continue;
				const t = new Tree(child);
				v.children.push(t);
				const edge = Edge.undirected(v.element, child);
				usedEdges.add(edge);
				currentChildren.add(edge);
				queue.push(t);
				visited.add(child);
			}
			yield {
				resetEdgeHighlights: Color.GrayedOut,
				resetNodeHighlights: Color.GrayedOut,
				newNodeHighlights: [
					{ set: Vertex.Set(v.element), color: Color.PrimaryHighlight },
					{ set: Vertex.Set(...queue.map(v => v.element)), color: Color.SecondaryHighlight },
					{ set: visited, color: Color.Normal }],
				newEdgeHighlights: [
					{ set: currentChildren, color: Color.PrimaryHighlight },
					{ set: usedEdges, color: Color.Normal }
				]

			}
		}
		const bfs = new BFS(rootTree);
		yield {
			resetEdgeHighlights: Color.GrayedOut,
			resetNodeHighlights: Color.Normal,
			newEdgeHighlights: [{ set: bfs.getUsedEdges(), color: Color.Normal }],
			finalResult: bfs
		};
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
		const edges = Edge.Set();
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
function animatePositions(prefix: string, nodes?:string[]) {
	sigma.plugins.animate(sigmainst, {
		x: prefix + '_x', y: prefix + '_y'
	}, {
			easing: 'cubicInOut',
			duration: 1000,
			nodes: nodes
		});
}
function highlightEdges(g: Graph, othersColor: string, ...edgeSets: Array<{ set: ActualSet<Edge>, color: string }>) {
	for (const _edge of g.getAllEdgesUndirected()) {
		let result = edgeSets.find(({set}) => set.has(_edge));
		const edge = sigmainst.graph.edges(_edge.id);
		if (result !== undefined) {
			edge.color = result.color;
			edge.size = 6;
		} else if (othersColor !== undefined) {
			edge.color = othersColor;
			edge.size = undefined;
		}
	}
}
function highlightVertices(g: Graph, othersColor: string, ...vertexSets: Array<{ set: ActualSet<Vertex>, color: string }>) {
	for (const vertex of g.getVertices()) {
		let result = vertexSets.find(({set}) => set.has(vertex));
		const node = sigmainst.graph.nodes(vertex.sigmaId);
		if (result !== undefined) {
			node.color = result.color;
		} else if (othersColor !== undefined) {
			node.color = othersColor;
		}
	}
}
function resetPositions(G: Graph) {
	animatePositions("original");
}

function *findPlanarEmbedding(g: PlanarGraph):StepByStepAlgorithm<Map<Vertex, Point>> {
	g.triangulateAll();
	sigmainst.graph.clear();
	g.draw(sigmainst);
	yield {
		//todo
	}
	const map = new Map<Vertex, Point>();
	const embeddedEdges = Edge.Set();
	const vertices = [...g.getVertices()];
	const v1 = Util.randomChoice(vertices);
	let v2 = Util.randomChoice(g.getEdgesUndirected(v1));
	let v3 = g.getNextEdge(v1, v2);
	[v2, v3] = [v3, v2]; // todo: check if necessary
	embeddedEdges.add(Edge.undirected(v1, v2));
	embeddedEdges.add(Edge.undirected(v2, v3));
	embeddedEdges.add(Edge.undirected(v3, v1));
	//while(v3 === v1) v3 = Util.randomChoice(g.getEdgesUndirected(v2));
	
	interface Facet {
		/** counter clock wise */
		vertices: Vertex[];
		isOuter?: boolean
	}
	function facetContains(f:Facet, v:Vertex) {
		const c = f.vertices.length;
		for(let i = 0; i < c; i++) {
			const vafter = f.vertices[i];
			const vref = f.vertices[(i+1)%c];
			const vbefore = f.vertices[(i+2)%c];
			for(let vert of g.getEdgesBetween(vbefore, vref, vafter))
				if(vert===v) return true;
		}
	}
	const facets = new Set<Facet>();
	facets.add({vertices: [v1,v2,v3]});
	facets.add({vertices: [v1,v3,v2], isOuter:true}); 
	map.set(v1, {x:0,y:0});
	map.set(v2, {x:0.5, y: Math.sqrt(3)/2});
	map.set(v3, {x:1, y:0});
	yield {
		changePositions:map,
		resetEdgeHighlights: "#cccccc",
		resetNodeHighlights: "#cccccc",
		newEdgeHighlights: [{set : embeddedEdges, color:Color.Normal}],
		newNodeHighlights: [{set: Vertex.Set(...map.keys()), color:Color.Normal}]
	};
	const halfEmbeddedEdges = (v:Vertex) => g.getEdgesUndirected(v).filter(w => map.has(w));
	while(map.size < vertices.length) {
		
		const v = vertices.find(v => {if(map.has(v)) return false; const e = halfEmbeddedEdges(v); return e.length >= 2});
		if(v === undefined) throw "bläsius error";
		const edges = halfEmbeddedEdges(v);
		yield {
			resetEdgeHighlights: "#cccccc",
			resetNodeHighlights: "#cccccc",
			changePositions:map,
			newEdgeHighlights: [
				{set: embeddedEdges, color: Color.Normal}
			],
			newNodeHighlights: [{set: Vertex.Set(v), color: Color.PrimaryHighlight}, 
				{set:Vertex.Set(...edges), color: Color.SecondaryHighlight},
				{set: Vertex.Set(...map.keys()), color:Color.Normal}]
		}
		if(edges.length === 2) {
			let [va, vb] = edges;
			let target: Facet;
			for(let facet of facets) if(facetContains(facet, v)) {
				console.log(v, "is in", facet);
				target = facet;
			}
			if(target.isOuter) {
				if(!g.hasEdgeUndirected(va, vb)) throw "wat do2?";
				let firstIndex = -1;
				for(const [i, vertex1] of target.vertices.entries()) {
					const vertex2 = target.vertices[(i+1)%target.vertices.length];
					if(vertex1 === vb && vertex2 === va) {
						// need to check both in case va is first in array and vb is last in array
						[va, vb] = [vb, va];
						firstIndex = i;
						break;
					} else if(vertex1 === va && vertex2 === vb) {
						firstIndex = i;
					}
				}
				// put new one left of first - second;
				const dist = 0.9*Math.sqrt(3)/2*Util.lineDistance(map.get(va), map.get(vb))[2];
				const center = Util.lineCenter(map.get(va), map.get(vb));
				const perp = Util.linePerpendicular(map.get(va), map.get(vb));
				const newPoint = {x:center.x-perp.x*dist, y:center.y-perp.y*dist};
				map.set(v, newPoint);
				embeddedEdges.add(Edge.undirected(v, va));
				embeddedEdges.add(Edge.undirected(v, vb));
				target.vertices.splice(firstIndex + 1, 0, v);
				facets.add({vertices: [va, vb, v]});
			}
		} else {
			throw "wat do?";
		}
		yield {
			resetEdgeHighlights: "#cccccc",
			resetNodeHighlights: "#cccccc",
			changePositions:map,
			newEdgeHighlights: [
				{set: embeddedEdges, color: Color.Normal}
			],
			newNodeHighlights: [{set: Vertex.Set(v), color: Color.PrimaryHighlight}, 
				{set:Vertex.Set(...edges), color: Color.SecondaryHighlight},
				{set: Vertex.Set(...map.keys()), color:Color.Normal}]
		}
	}
}

type Separator = { v1: Iterable<Vertex>, v2: Iterable<Vertex>, s: Iterable<Vertex> };
function* treeLemma(G: Graph, bfs: BFS): StepByStepAlgorithm<Separator> {
	const parentMap = new Map<Vertex, Vertex>();
	for (const layer of bfs.treeLayers) for (const {element, parent} of layer) parentMap.set(element, parent);

	const leaves: Vertex[] = [];
	bfs.tree.preOrder(t => { if (t.children.length === 0) leaves.push(t.element) });
		
	/** vertex count including self */
	type res = [number, Vertex[]];
	const childrenCount = new Map<Vertex, res>();
	leaves.forEach(leaf => childrenCount.set(leaf, [1, [leaf]]));
	bfs.tree.postOrder(node => {
		const outp:res = node.children.reduce<res>(([sum, children]: res, node: Tree<Vertex>) => {
			const [sum2, children2] = childrenCount.get(node.element);
			return <res>[sum + sum2, children.concat(children2)];
		}, [1, [node.element]]);
		childrenCount.set(node.element, outp);
	});
	/**  elements to the left / the right of the edge from this node to it's parent */
	const rightLeftCounts = new Map<Vertex, [number, number, Vertex[], Vertex[]]>();
	bfs.tree.postOrder((node, parent, layer, childIndex) => {
		const vertex = node.element;
		if (parent === null) return; // root
		const parentVertex = parent.element;
		const edges = G.getEdgesUndirected(parentVertex);
		const parentParentIndex = edges.indexOf(parentMap.get(parentVertex));
		const selfIndex = edges.indexOf(vertex);
		if (parentParentIndex === selfIndex || parentParentIndex < 0 && selfIndex < 0) throw "assertion error";
		let leftNodes: Vertex[] = [];
		let rightNodes: Vertex[] = [];
		if (parentParentIndex > selfIndex) {
			leftNodes = edges.slice(selfIndex + 1, parentParentIndex);
			rightNodes = edges.slice(parentParentIndex + 1).concat(edges.slice(0, selfIndex));
		} else {
			leftNodes = edges.slice(selfIndex + 1).concat(edges.slice(0, parentParentIndex));
			rightNodes = edges.slice(parentParentIndex + 1, selfIndex);
		}
		const leftCount = leftNodes.reduce((sum, node) => sum + childrenCount.get(node)[0], 0);
		const rightCount = rightNodes.reduce((sum, node) => sum + childrenCount.get(node)[0], 0);
		rightLeftCounts.set(vertex, [leftCount, rightCount, leftNodes, rightNodes]);
	});
	const treeEdges = bfs.getUsedEdges();
	const nonTreeEdges = [...G.getAllEdgesUndirected()].filter(e => !treeEdges.has(e));
	const nonTreeEdge = Util.randomChoice(nonTreeEdges);

	const path1 = [nonTreeEdge.v1], path2 = [nonTreeEdge.v2];
	while (parentMap.get(path1[0]) !== undefined) path1.unshift(parentMap.get(path1[0]));
	const path1Set = new Set(path1);
	// only go up until find crossing with other path
	while (true) {
		const parent = parentMap.get(path2[0]);
		if (parent === undefined) break;
		if (path1Set.has(parent)) {
			path2.unshift(parent);
			break;
		}
		path2.unshift(parent);
	}
	// find common root
	const commonRoot = path2[0];
	while (path1[0] !== commonRoot) path1.shift();

	const path1Edges: Edge[] = [];
	for (let i = 0; i < path1.length - 1; i++) path1Edges.push(Edge.undirected(path1[i], path1[i + 1]));
	const path2Edges: Edge[] = [];
	for (let i = 0; i < path2.length - 1; i++) path2Edges.push(Edge.undirected(path2[i], path2[i + 1]));
	yield {
		resetEdgeHighlights: Color.GrayedOut,
		resetNodeHighlights: Color.Normal,
		newNodeHighlights: [
			{ set: Vertex.Set(nonTreeEdge.v1, nonTreeEdge.v2), color: Color.PrimaryHighlight },
			{ set: Vertex.Set(commonRoot), color: Color.SecondaryHighlight }
		],
		newEdgeHighlights: [
			{ set: Edge.Set(nonTreeEdge), color: Color.PrimaryHighlight },
			{ set: Edge.Set(...path1Edges), color: Color.SecondaryHighlight },
			{ set: Edge.Set(...path2Edges), color: Color.TertiaryHighlight },
			{ set: treeEdges, color: Color.Normal }
		]
	};

	let innerSize = 0;
	let innerNodes: Vertex[] = [];
	for (let [i, v] of path1.entries()) {
		if (i == 0 || i == 1) continue; //skip root
		const [left, right, l, r] = rightLeftCounts.get(v);
		innerSize += right;
		innerNodes = innerNodes.concat(Util.flatten(r.map(node => childrenCount.get(node)[1].concat([node]))));
	}
	console.log(innerSize);
	yield {
		resetNodeHighlights: Color.GrayedOut,
		newNodeHighlights: [
			{set: Vertex.Set(...innerNodes), color:Color.PrimaryHighlight}
		]
	}

	yield { 
		finalResult: { v1: null, v2: null, s: null } }
}

function PST(G: Graph): Separator {
	const n = G.n;
	if (n < 5) throw "n is not >= 5";
	const tree = StepByStep.complete(BFS.run(G, G.getSomeVertex()));
	const layers = tree.treeLayers.map(layer => layer.map(ele => ele.element));
	layers.push([]); // empty layer for M
	let nodeCount = 0;
	let middleLayer = -1;
	const flat = Util.flatten;
	for (let [i, layer] of layers.entries()) {
		nodeCount += layer.length;
		if (nodeCount > n / 2) {
			middleLayer = i;
			break;
		}
	}
	if (layers[middleLayer].length <= 4 * Math.sqrt(n)) return {
		v1: flat(layers.slice(0, middleLayer)),
		v2: flat(layers.slice(middleLayer + 1)),
		s: layers[middleLayer]
	}
	let m = middleLayer;
	while (layers[m].length > Math.sqrt(n)) m--;
	let M = middleLayer;
	while (layers[M].length > Math.sqrt(n)) m++;
	const A1 = layers.slice(0, m);
	const A2 = layers.slice(m + 1, M);
	const A3 = flat(layers.slice(M + 1));
	if (A2.reduce((sum, layer) => sum + layer.length, 0) <= 2 / 3 * n) {
		return { v1: flat(A2), v2: flat([...A1, ...A2]), s: [...layers[m], ...layers[M]] };
	}
	// |A2| > 2/3 n
	const {v1: v1_b, v2: v2_b, s: s_b} = StepByStep.complete(treeLemma(null, null));
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



document.addEventListener('DOMContentLoaded', () => GUI.init());

interface Point {
	x: number; y: number;
}


const TestGraphs = {
	testAGraph: () => {
		return Graph.fromAscii(
			`
__________
         1

2

         3
__________`, [1, 2, 3]);
	},
	testBGraph: () => {
		return Graph.fromAscii(
			`
__________
     1

     2

3        4`, [1, 2, 3], [2, 4]);
	},
	testCGraph: () => {
		return Graph.fromAscii(
			`
__________
1  2

3  4
__________`, [1, 2, 4, 3, 1], [2, 3]);
	},
	testDGraph: () => {
		return Graph.fromAscii(
			`
__________
1  2  3

4  5  6  7

  8  9
__________`, [1, 2, 3, 6, 5, 4, 1], [2, 5, 3], [7, 6, 9, 8, 4]);
	}
}