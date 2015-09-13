var sigmainst: SigmaJs.Sigma, g: PlanarGraph;

type StepByStepAlgorithm<T> = IterableIterator<StepByStepState<T>>;
type Highlights<T> = Iterable<{ set: ActualSet<T>, color: string }>;
interface StepByStepState<FinalResult> {
	resetEdgeHighlights?: string;
	resetNodeHighlights?: string;
	newEdgeHighlights?: Highlights<Edge>,
	newNodeHighlights?: Highlights<Vertex>,
	changePositions?: Map<Vertex, Point>,
	/** undefined if not done */
	finalResult?: FinalResult,
	textOutput: string
}

var Color = {
	PrimaryHighlight: "#ff0000",
	SecondaryHighlight: "#00ff00",
	TertiaryHighlight: "#0000ff",
	Normal: "#000000",
	GrayedOut: "#999999",
	Invisible: "#ffffff"
}
class GraphAlgorithm {
	constructor(public name: string, public supplier: () => StepByStepAlgorithm<any>) {

	}
}

const Algorithms = [
	new GraphAlgorithm("Breadth First Search", () => BFS.run(g)),
	new GraphAlgorithm("vertex disjunct Menger algorithm", () => mengerVertexDisjunct(g, g.getRandomVertex(), g.getRandomVertex())),
	new GraphAlgorithm("Triangulate Graph", () => g.triangulateAll()),
	new GraphAlgorithm("Find planar embedding", () => findPlanarEmbedding(g)),
	new GraphAlgorithm("Tree Lemma (incomplete) (Separator ≤ 2h + 1)", () => treeLemma(g, StepByStep.complete(BFS.run(g)))),
];

module GUI {
	export let currentAlgorithm: StepByStepAlgorithm<any> = null;
	let timeout: number = undefined;
	let running = false;
	export function algorithmStep() {
		if (currentAlgorithm) {
			if (StepByStep.step(currentAlgorithm, algorithmCallback)) {
				onAlgorithmFinish();
			}
		} else {
			onAlgorithmFinish();
		}
	}
	export function algorithmCallback() {
		if(running) setTimeout(() => !running || algorithmStep(), 200);
	}
	export function onAlgorithmFinish() {
		$("#stepButton").prop("disabled", true);
		$("#runButton").prop("disabled", true);
		if (running) {
			algorithmRunToggle();
		}
		currentAlgorithm = null;
	}
	export function algorithmRunToggle() {
		const btn = $("#runButton");
		if (running) {
			running = false;
			btn.text("Run");
			clearInterval(timeout);
		} else {
			running = true;
			btn.text("Stop");
			algorithmStep();
		}
	}
	export function startAlgorithm() {
		if(running) algorithmRunToggle();
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
			highlightEdges(g, Color.Normal, { set: StepByStep.complete(BFS.run(g)).getUsedEdges(), color: Color.PrimaryHighlight });
			sigmainst.refresh();
		},
		forceLayout: () => {
			sigmainst.configForceAtlas2({ slowDown: 1 });
			sigmainst.startForceAtlas2();
			setTimeout(() => sigmainst.stopForceAtlas2(), 2000);
		},
		noHighlights: () => {
			highlightEdges(g, Color.Normal);
			highlightVertices(g, Color.Normal)
			sigmainst.refresh();
		},
		loadGraph: () => {
			onAlgorithmFinish();
			sigmainst.graph.clear();
			g = TestGraphs[$("#selectGraph").val()](+$("#vertexCount").val());
			g.draw(sigmainst);
		},
		replaceGraph: (newg:PlanarGraph) => {
			sigmainst.graph.clear();
			g = newg;
			g.draw(sigmainst);
		}
	}

	export function init() {
		sigma.renderers.def = sigma.renderers.canvas;
		sigmainst = new sigma({
			container:$("#graph-container")[0],
			settings: {
				minEdgeSize: 0.5, maxEdgeSize: 4,
				doubleClickEnabled: false,
				enableEdgeHovering: true,
				edgeHoverSizeRatio: 1,
			}
		});
		sigmainst.bind("doubleClickEdge", ev => {
			//console.log(e.data.edge);
			//for debug purposes
			const e = <SigmaJs.Edge> ev.data.edge;
			const s = g.getVertexById(+e.source), t = g.getVertexById(+e.target);
			sigmainst.graph.dropEdge(e.id);
			g.removeEdgeUndirected(s,t);
			sigmainst.refresh();
		});
		sigma.plugins.dragNodes(sigmainst, sigmainst.renderers[0]);
		const algoSelect = <HTMLSelectElement>$("#selectAlgorithm")[0];
		$(algoSelect).change(() => onAlgorithmFinish());
		for (let [i, algo] of Algorithms.entries()) {
			algoSelect.add(new Option(algo.name, i + "", i === 0));
		}
		const graphSelect = <HTMLSelectElement>$("#selectGraph")[0];
		for (let [i,g] of Object.keys(TestGraphs).entries()) {
			graphSelect.add(new Option(g, g, i === 0));
		}
		Macros.loadGraph();
	}

}
class StepByStep {
	static step<T>(algo: StepByStepAlgorithm<T>, callback:() => void): boolean {
		const next = algo.next();
		if (next.done) return true;
		StepByStep.applyState(next.value, callback);
		return next.value.finalResult !== undefined;
	}
	static complete<T>(algo: StepByStepAlgorithm<T>): T {
		for (const state of algo) {
			if (state.finalResult !== undefined) return state.finalResult;
		}
		throw "did not get final result"
	}
	static applyState(state: StepByStepState<any>, callback:()=>void) {
		highlightEdges(g, state.resetEdgeHighlights, ...(state.newEdgeHighlights || []));
		highlightVertices(g, state.resetNodeHighlights, ...(state.newNodeHighlights || []));
		$("#stateOutput").text(state.textOutput);
		sigmainst.refresh();
		if(state.changePositions !== undefined) {
			addPositions("_temp", state.changePositions);
			animatePositions("_temp", [...state.changePositions.keys()].map(v => v.sigmaId), 400, callback);
		} else {
			callback();
		}
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
				],
				textOutput: `Found ${visited.size} of ${G.n} vertices`
			}
		}
		const bfs = new BFS(rootTree);
		yield {
			resetEdgeHighlights: Color.GrayedOut,
			resetNodeHighlights: Color.Normal,
			newEdgeHighlights: [{ set: bfs.getUsedEdges(), color: Color.Normal }],
			finalResult: bfs,
			textOutput: "BFS successful"
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
function animatePositions(prefix: string, nodes?:string[], duration:number = 1000, callback?:()=>void) {
	sigma.plugins.animate(sigmainst, {
		x: prefix + '_x', y: prefix + '_y'
	}, {
			easing: 'cubicInOut',
			duration: duration,
			nodes: nodes,
			onComplete: callback
		});
}
function highlightEdges(g: Graph, othersColor: string, ...edgeSets: Array<{ set: ActualSet<Edge>, color: string }>) {
	for (const _edge of g.getAllEdgesUndirected()) {
		let result = edgeSets.find(({set}) => set.has(_edge));
		const edge = sigmainst.graph.edges(_edge.id);
		if (result !== undefined) {
			edge.color = result.color;
			edge.size = 3;
		} else if (othersColor !== undefined) {
			edge.color = othersColor;
			edge.size = 1;
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
	const embeddedSubgraph = new PlanarGraph();
	StepByStep.complete(g.triangulateAll());
	sigmainst.graph.clear();
	g.draw(sigmainst);
	yield {
		textOutput:"Triangulated"
		//todo
	}
	const map = new Map<Vertex, Point>();
	const vertices = [...g.getVertices()];
	const v1 = Util.randomChoice(vertices);
	let v2 = Util.randomChoice(g.getEdgesUndirected(v1));
	let v3 = g.getNextEdge(v1, v2);
	embeddedSubgraph.addVertex(v1);
	embeddedSubgraph.addVertex(v2);
	embeddedSubgraph.addVertex(v3);
	embeddedSubgraph.addEdgeUndirected(v1, v2);
	embeddedSubgraph.addEdgeUndirected(v2, v3);
	embeddedSubgraph.addEdgeUndirected(v3, v1);
	(<any>window)._g = embeddedSubgraph;
	//while(v3 === v1) v3 = Util.randomChoice(g.getEdgesUndirected(v2));
	
	interface Facet {
		/** counter clock wise */
		vertices: Vertex[];
		isOuter?: boolean
	}
	function facetContainsAt(f:Facet, v:Vertex, i:number) {
		const c = f.vertices.length;
		const vafter = f.vertices[(i+c-1)%c];
		const vref = f.vertices[i%c];
		const vbefore = f.vertices[(i+1)%c];
		for(let vert of g.getEdgesBetween(vbefore, vref, vafter))
			if(vert===v) return true;
		return false;
	}
	function facetContains(f:Facet, v:Vertex) {
		for(let i = 0; i < f.vertices.length; i++) {
			if(facetContainsAt(f, v, i)) return true;
		}
		return false;
	}
	const facets = new Set<Facet>();
	facets.add({vertices: [v1,v2,v3], isOuter: true});
	facets.add({vertices: [v1,v3,v2]}); 
	map.set(v1, {x:0, y:0});
	map.set(v2, {x:1, y:0});
	map.set(v3, {x:0.5, y: Math.sqrt(3)/2});
	yield {
		textOutput: "Added initial facet",
		changePositions:map,
		resetEdgeHighlights: "#cccccc",
		resetNodeHighlights: "#cccccc",
		newEdgeHighlights: [{set: embeddedSubgraph.getAllEdgesUndirected(), color:Color.Normal}],
		newNodeHighlights: [{set: Vertex.Set(...map.keys()), color:Color.Normal}]
	};
	const halfEmbeddedEdges = (v:Vertex) => g.getEdgesUndirected(v).filter(w => map.has(w));
	while(map.size < vertices.length) {
		
		const v = vertices.find(v => {if(map.has(v)) return false; const e = halfEmbeddedEdges(v); return e.length >= 2});
		if(v === undefined) throw "bläsius error";
		const edges = halfEmbeddedEdges(v);
		yield {
			textOutput: "next vertex to insert",
			resetEdgeHighlights: "#cccccc",
			resetNodeHighlights: "#cccccc",
			changePositions:map,
			newEdgeHighlights: [
				{set: embeddedSubgraph.getAllEdgesUndirected(), color: Color.Normal}
			],
			newNodeHighlights: [{set: Vertex.Set(v), color: Color.PrimaryHighlight}, 
				{set:Vertex.Set(...edges), color: Color.SecondaryHighlight},
				{set: Vertex.Set(...map.keys()), color:Color.Normal}]
		}
		
		const neighbour = edges[0];
		const containingFacets = [...facets].filter(facet => {
			const i = facet.vertices.indexOf(neighbour);
			if(i<0) return false;
			return facetContainsAt(facet, v,i);
		});
		if(containingFacets.length !== 1) throw new Error("internal error " + containingFacets);
		const containingFacet = containingFacets[0];
		console.log(v, "is in", containingFacet);
		
		const points = containingFacet.vertices.map(v => map.get(v));
		let point:Point;
		if(Util.polygonConvex(points)) {
			console.log("is convex");
			point = Util.polygonCentroid(points);
		} else {
			point = Util.polygonKernel(points);
		}
		if(!point) {
			yield {
				finalResult: null,
				textOutput: "Embedding error: timeout while searching for new polygon position"
			}
			return;
		}
		map.set(v, point);
		yield {
			textOutput: "moved vertex to new position",
			resetEdgeHighlights: "#cccccc",
			resetNodeHighlights: "#cccccc",
			changePositions:map,
			newEdgeHighlights: [
				{set: embeddedSubgraph.getAllEdgesUndirected(), color: Color.Normal}
			],
			newNodeHighlights: [{set: Vertex.Set(v), color: Color.PrimaryHighlight}, 
				{set:Vertex.Set(...edges), color: Color.SecondaryHighlight},
				{set: Vertex.Set(...map.keys()), color:Color.Normal}]
		}
		let lastEdge:Vertex = undefined;
		const edgesSet = Vertex.Set(...edges);
		embeddedSubgraph.addVertex(v);
		for(const [i,vertex] of containingFacet.vertices.entries()) {
			if(edgesSet.has(vertex)) {
				embeddedSubgraph.addEdgeUndirected(v, vertex, lastEdge, containingFacet.vertices[(i+1)%containingFacet.vertices.length]);
				lastEdge = vertex;
			}
		}
		yield {
			textOutput: `added new edges to vertex ${v}`,
			newEdgeHighlights: [{set: Edge.Set(...[...edgesSet].map(v2 => Edge.undirected(v,v2))), color:Color.PrimaryHighlight}]
		}
		facets.delete(containingFacet);
		for(let facet of embeddedSubgraph.facetsAround(v)) {
			facets.add({vertices:facet});
			yield {
				textOutput: "adding facets",
				resetEdgeHighlights: "#cccccc",
				newEdgeHighlights: [
					{set: Edge.Set(...Edge.Path(facet, true)), color: Color.PrimaryHighlight},
					{set: embeddedSubgraph.getAllEdgesUndirected(), color: Color.Normal}
				]
			}
		}
	}
	yield {
		textOutput: "Embedding successful",
		resetNodeHighlights: Color.Normal,
		resetEdgeHighlights: Color.Normal,
		finalResult: map
	}
}

function* mengerVertexDisjunct(orig_g:PlanarGraph, s:Vertex, t:Vertex): StepByStepAlgorithm<Vertex[][]> {
	yield {
		textOutput: `starting menger from ${s} to ${t}`,
		resetEdgeHighlights: Color.Normal,
		resetNodeHighlights: Color.Normal,
		newNodeHighlights: [
			{set: Vertex.Set(s,t), color:Color.TertiaryHighlight},
		]
	}
	const g = orig_g.clone();
	const foundPaths:Vertex[][] = [];
	class Info {
		pathId: number;
		pathIndex: number;
	}
	const infos = new Map<Vertex, Info>();
	let pathId = 0;
	for(const startv of g.getEdgesUndirected(s)) {
		const p = {
			arr: [s,startv],
			get v(){ return this.arr[this.arr.length-1]; },
			set v(x) { this.arr[this.arr.length-1] = x; },
			get prev(){ return this.arr[this.arr.length-2]; },
			set prev(x) { this.arr[this.arr.length-2] = x; },
		};
		while(true) {
			if(p.v === p.arr[p.arr.length - 3]) {
				// edge iteration came full circle, go back
				p.arr.pop();
			}
			if(p.v === s) {
				// skip
				p.v = g.getNextEdge(p.prev, p.v);
				continue;
			}
			yield {
				textOutput: `exploring node ${p.v} at index ${p.arr.length-1} of path ${pathId+1}`,
				resetEdgeHighlights: Color.Invisible,
				resetNodeHighlights: Color.GrayedOut,
				newEdgeHighlights: [
					{set: Edge.Set(...Edge.Path(p.arr)), color:Color.PrimaryHighlight},
					{set: Edge.Set(...Util.flatten(foundPaths.map(path => Edge.Path(path)))), color:Color.Normal},
					{set: g.getAllEdgesUndirected(), color: Color.GrayedOut}
				],
				newNodeHighlights: [
					{set: Vertex.Set(p.v), color:Color.PrimaryHighlight},
					{set: Vertex.Set(p.prev), color:Color.SecondaryHighlight},
					{set: Vertex.Set(s,t), color:Color.TertiaryHighlight},
					{set: Vertex.Set(...Util.flatten(foundPaths)), color:Color.Normal}
				]
			}
			if(p.v === t) {
				if(foundPaths[pathId]) throw Error("nooo");
				foundPaths[pathId] = p.arr;
				pathId++;
				break;
			}
			if(infos.has(p.v)) {
				// conflict
				const {pathId:theirPathId, pathIndex:theirPathIndex} = infos.get(p.v);
				let backtrackRemove = false;
				if(theirPathId == pathId) {
					// conflict path is self
					if(p.arr[theirPathIndex] === p.v) {
						// did not backtrack out of that path => conflict from left
						backtrackRemove = true;
					} else {
						// node already visited, but had to backtrack => ignore node
						backtrackRemove = true;
					}
				} else {
					const otherPath = foundPaths[theirPathId];
					if(!otherPath) throw Error("noo");
					if(otherPath[theirPathIndex] === p.v) {
						// node already contained in complete path
						if(g.edgeIsBetween(p.v, p.prev, otherPath[theirPathIndex - 1], otherPath[theirPathIndex + 1])) {
							// conflict from right => replace path segments
							const myNewPath = otherPath.splice(0, theirPathIndex + 1, ...p.arr);
							yield {textOutput: "replacing path segments"};
							for(const v of myNewPath) v === s || (infos.get(v).pathId = pathId);
							for(const v of p.arr) v === s || (infos.get(v).pathId = theirPathId);
							for(const [i, v] of otherPath.entries()) v === s || v === t || (infos.get(v).pathIndex = i);
							p.arr = myNewPath;
							// new iteration (resulting in conflict from left)
							continue;
						} else {
							// conflict from left
							backtrackRemove = true;
						}
					} else {
						// visited, but not in final path => ignore
					}
				}
				if(backtrackRemove) {
					const next = g.getNextEdge(p.prev, p.v);
					if(next === p.v) break;
					// g.removeEdgeUndirected(p.prev, p.v);
					p.v = next;
					if(p.prev === s) break; // backtracked into start, abort iteration
					continue;
				}
			}
			infos.set(p.v, {pathIndex: p.arr.length - 1, pathId: pathId});
			p.arr.push(g.getNextEdge(p.v, p.prev));
		}
	}
	yield {
		textOutput: `finished. found ${foundPaths.length} paths from ${s} to ${t}`,
		resetEdgeHighlights: Color.GrayedOut,
		resetNodeHighlights: Color.GrayedOut,
		newEdgeHighlights: [
			{set: Edge.Set(...Util.flatten(foundPaths.map(path => Edge.Path(path)))), color:Color.Normal},
		],
		newNodeHighlights: [
			{set: Vertex.Set(s,t), color:Color.TertiaryHighlight},
			{set: Vertex.Set(...Util.flatten(foundPaths)), color:Color.Normal}
		],
		finalResult: foundPaths
	}
}

type Separator = { v1: Iterable<Vertex>, v2: Iterable<Vertex>, s: Iterable<Vertex> };
function* treeLemma(G: PlanarGraph, bfs: BFS): StepByStepAlgorithm<Separator> {
	G = StepByStep.complete(G.triangulateAll());
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
		if (parentParentIndex === selfIndex || parentParentIndex < 0 && selfIndex < 0) throw new Error("assertion error");
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

	let path1 = [nonTreeEdge.v1], path2 = [nonTreeEdge.v2];
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
	if(parentMap.has(commonRoot) && G.edgeIsBetween(commonRoot, path2[1], path1[1], parentMap.get(commonRoot))) {
		// p2 is right of p1
	} else {
		[path1, path2] = [path2, path1];
	}

	const path1Edges: Edge[] = Edge.Path(path1);
	const path2Edges: Edge[] = Edge.Path(path2);
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
		],
		textOutput:"found initial nontree edge and circle"
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
		],
		textOutput:"found inner node count"
	}

	yield { textOutput:"not implemented",
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


var TestGraphs:{[name:string]: (n:number) => PlanarGraph} = {
	sampleGraph: n => {
		return PlanarGraph.deserialize('{"pos":{"0":{"x":0.9567903648770978,"y":0.3044487369932432},"1":{"x":0.5267492126137234,"y":0.21662801926871264},"2":{"x":0.2551442743421186,"y":0.8647535207902879},"3":{"x":0.8148150562351227,"y":0.62403542667612},"4":{"x":0.27880682578244786,"y":0.31370799625250245},"5":{"x":0.7160496241363572,"y":0.43164859540039985},"6":{"x":1.0627574430663982,"y":0.3236239040423752},"7":{"x":0.21193439779890877,"y":0.3281112884335724},"8":{"x":0.15946526199643962,"y":0.3816092308204037},"9":{"x":0.7479426282515835,"y":0.1703317229724163},"10":{"x":0.6903294595273036,"y":0.8410584275795667},"11":{"x":0.6903294595273037,"y":0.21251279293126402},"12":{"x":1.1284132082129015,"y":0.6281506530135685},"13":{"x":0.04288239870220423,"y":0.3120930497534573},"14":{"x":1.000000241420308,"y":0.5952288423139801},"15":{"x":0.5720167023256576,"y":0.4165886546887164},"16":{"x":0.10905373936269469,"y":0.3610330991331609},"17":{"x":0.7541154677577564,"y":0.2464634102152147},"18":{"x":0.9259261673462336,"y":0.5005786365526633},"19":{"x":0.4783953031487029,"y":0.43716478637595924},"20":{"x":0.39819170275191407,"y":0.3277391303798239},"21":{"x":0.4846114558383339,"y":0.08802719622344515},"22":{"x":0.6485231048427522,"y":0.7397751514799893},"23":{"x":0.07559850439429283,"y":0.12803629226982594},"24":{"x":0.24376398022286594,"y":0.012793667381629348},"25":{"x":0.5401236982104313,"y":0.8204822958923239},"26":{"x":0.6944879990482105,"y":0.31539345136747804},"27":{"x":0.03208110178820789,"y":0.38012674218043685},"28":{"x":0.41358048833388805,"y":0.722144210244272},"29":{"x":0.8993361520115286,"y":0.009576051961630583}},"v":{"0":[17,22,18,14,12,6,29],"1":[20,15,26,17,11,9,29,21,24,23],"2":[10,25,28,19,7,8,27],"3":[22,12,18],"4":[19,20,23],"5":[22,17,26,15],"6":[12],"7":[8,19,23],"8":[23],"9":[11,29],"10":[12,22,25],"11":[17],"12":[14,22],"13":[27,16,23],"14":[18],"15":[26],"16":[23],"17":[26,29],"18":[],"19":[28,25,20],"20":[23],"21":[29,24],"22":[],"23":[24],"24":[29],"25":[],"26":[],"27":[],"28":[],"29":[]}}');
	},
	random: n => {
		return PlanarGraph.randomPlanarGraph(+(<HTMLInputElement>document.getElementById("vertexCount")).value);
	},
	triangles: n => {
		// aspect ratio
		const r = 4/3;
		const w = Math.sqrt(n * r)|0, h = (w/r)|0;
		const g = new PlanarGraph();
		const layers:Vertex[][] = Util.array(h, i => Util.array(w, j => {
			const v = new Vertex();
			g.addVertex(v);
			return v;
		}));
		const pos = new Map<Vertex, Point>();
		for(let l = 0; l < layers.length; l++) {
			const la = layers[l], lb = layers[l+1];
			for(const i of la.keys()) {
				pos.set(la[i], {y:l, x: i + (l%2)/2});
				if(lb) g.addEdgeUndirected(la[i], lb[i]);
				if(i>0) {
					g.addEdgeUndirected(la[i], la[i-1]);
					if(lb) {
						if(l%2) g.addEdgeUndirected(la[i-1], lb[i]);
						else g.addEdgeUndirected(la[i], lb[i-1]);
					}
				}
			}
		}
			
		g.setPositionMap(pos.get.bind(pos));
		return g;
	},
	circle: n => {
		const vs = Util.array(n, i => new Vertex());
		const map = new Map<Vertex, Point>();
		const g = new PlanarGraph(vs);
		Edge.Path(vs, true).forEach(e => g.addEdgeUndirected(e.v1, e.v2));
		for(const [i, v] of vs.entries()) {
			const r = 0.5;
			const φ = i/n * 2 * Math.PI;
			map.set(v, {x:r*Math.cos(φ), y:r*Math.sin(φ)});
		}
		g.setPositionMap(map.get.bind(map));
		return g;
	}
	/*testAGraph: () => {
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
	}*/
}