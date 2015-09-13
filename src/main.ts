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

const Color = {
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
	new GraphAlgorithm("Tree Lemma (Separator ≤ 2h + 1)", () => treeLemma(g, StepByStep.complete(BFS.run(g)))),
	new GraphAlgorithm("Find embedding", () => findPlanarEmbedding(g)),
	new GraphAlgorithm("vertex disjunct Menger algorithm", () => mengerVertexDisjunct(g, g.getRandomVertex(), g.getRandomVertex()))
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
			highlightEdges(g, "#000000", { set: StepByStep.complete(BFS.run(g)).getUsedEdges(), color: Color.PrimaryHighlight });
			sigmainst.refresh();
		},
		noHighlights: () => {
			highlightEdges(g, "#000000");
			sigmainst.refresh();
		},
		newRandomPlanarGraph: () => {
			onAlgorithmFinish();
			sigmainst.graph.clear();
			g = PlanarGraph.randomPlanarGraph(+(<HTMLInputElement>document.getElementById("vertexCount")).value);
			g.draw(sigmainst);
		}
	}

	export function init() {
		sigmainst = new sigma('graph-container');
		Macros.newRandomPlanarGraph();
		const select = <HTMLSelectElement>$("#selectAlgorithm")[0];
		$(select).change(() => onAlgorithmFinish());
		for (let [i, algo] of Algorithms.entries()) {
			select.add(new Option(algo.name, i + "", i === 0));
		}
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
function animatePositions(prefix: string, nodes?:string[], duration?:number, callback?:()=>void) {
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
	const embeddedSubgraph = new PlanarGraph();
	g.triangulateAll();
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
					{set: Edge.Set(...vertexArrayToEdges(facet, true)), color: Color.PrimaryHighlight},
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

function vertexArrayToEdges(path:Vertex[], wrapAround = false) {
	const pathEdges: Edge[] = [];
	for (let i = 0; i < path.length - 1; i++) pathEdges.push(Edge.undirected(path[i], path[i + 1]));
	if(wrapAround && path.length > 1) pathEdges.push(Edge.undirected(path[path.length-1], path[0]));
	return pathEdges;
}
function* mengerVertexDisjunct(orig_g:PlanarGraph, s:Vertex, t:Vertex): StepByStepAlgorithm<Vertex[][]> {
	let pathCounter = 0;
	let paths:Vertex[][] = [];
	const g = orig_g.clone();
	class Info {
		get previous() {return this.path[this.pathIndex - 1]; }
		get next() {return this.path[this.pathIndex + 1]; }
		constructor(public path: Vertex[], public pathIndex: number) {}
		static fromPrevious(i:Info, v:Vertex) {
			let path = i.path;
			if(i.path.length === 1) path = path.slice();
			if(path.length > i.pathIndex) path.splice(i.pathIndex + 1);
			path.push(v);
			return new Info(path, i.pathIndex+1);
		}
	}
	let infoMap = new Map<Vertex, Info>([[s, new Info([s], 0)]]);
	const stHighlight = {set:Vertex.Set(s,t), color:Color.TertiaryHighlight};
	function* visit(v: Vertex, prev: Vertex): StepByStepAlgorithm<Vertex[][]> {
		if(!v) return;
		if(v === infoMap.get(prev).previous) {
			const next = g.getNextEdge(v, prev);
			g.removeEdgeUndirected(v, prev);
			yield* visit(next, v);
			return true;
		}
		if(v === s) {
			const next = g.getNextEdge(prev, v);
			// g.removeEdgeUndirected(prev, v);
			yield* visit(next, prev);
			return;
		}
		if(v === t) {
			yield {
				textOutput:"Found path!",
				newEdgeHighlights:[{set:Edge.Set(Edge.undirected(prev, v)),color:Color.PrimaryHighlight}]
			};
			const info = infoMap.get(prev);
			info.path.push(v);
			paths.push(info.path);
			return true;
		}
		if(infoMap.has(v)) {
			const theirInfo = infoMap.get(v);
			console.log(`already visited ${v} from ${theirInfo.previous} to ${theirInfo.next}, now from ${prev}`);
			if(theirInfo.path[theirInfo.pathIndex] === v && theirInfo.next && g.edgeIsBetween(v, prev, theirInfo.previous, theirInfo.next)) {
				console.log("conflict from right");
				// conflict from right
				// swap prev arrays
				const thisInfo = infoMap.get(prev);
				[thisInfo.pathIndex, theirInfo.pathIndex] = [theirInfo.pathIndex, thisInfo.pathIndex];
				const oldStartSegment = thisInfo.path;
				thisInfo.path = thisInfo.path.slice(); theirInfo.path = theirInfo.path.slice();
				const newStartSegment = theirInfo.path.splice(0, thisInfo.pathIndex, ...thisInfo.path);
				thisInfo.path.splice(0, thisInfo.path.length, ...newStartSegment);
				prev = thisInfo.previous;
				yield {
					textOutput: "Conflict from right - replacing segments",
					resetEdgeHighlights: Color.GrayedOut,
					newEdgeHighlights: [
						{set: Edge.Set(...vertexArrayToEdges(newStartSegment)), color:Color.PrimaryHighlight},
						{set: Edge.Set(...vertexArrayToEdges(oldStartSegment)), color: Color.SecondaryHighlight},
						{set: Edge.Set(...vertexArrayToEdges(theirInfo.path)), color:Color.TertiaryHighlight}
					]
				}
			}
			console.log("conflict from left");
			// conflict from left
			// backtrack remove
			const next = g.getNextEdge(prev, v);
			g.removeEdgeUndirected(prev, v);
			yield* visit(next, prev);
			return;
		} else {
			infoMap.set(v, Info.fromPrevious(infoMap.get(prev), v));
			console.log(infoMap.get(v));
			yield {
				textOutput: "Visiting "+v,
				resetNodeHighlights: Color.GrayedOut,
				resetEdgeHighlights: Color.Invisible,
				newNodeHighlights: [
					{set: Vertex.Set(v), color:Color.PrimaryHighlight},
					{set: Vertex.Set(prev), color:Color.SecondaryHighlight},
					stHighlight,
					{set: Vertex.Set(...infoMap.keys()), color: Color.Normal}
				],
				newEdgeHighlights: [
					{set: Edge.Set(...vertexArrayToEdges(infoMap.get(v).path)), color:Color.PrimaryHighlight},
					{set: Edge.Set(...Util.flatten(paths.map(path => vertexArrayToEdges(path)))), color: Color.Normal},
					{set: g.getAllEdgesUndirected(), color: Color.GrayedOut}
				]
			}
			const res = yield *visit(g.getNextEdge(v, prev), v);
			if(res === true) return true;
			/*for(const next of g.getNextEdges(v, prev)) {
				const res = yield *visit(next, v);
				console.log(next, res);
				if(res === true) return true;
			}*/
		}
	}
	for(const v of g.getEdgesUndirected(s)) {
		pathCounter++;
		yield {
			textOutput: "Starting new path "+pathCounter,
			resetEdgeHighlights: Color.GrayedOut,
			resetNodeHighlights: Color.Normal,
			newEdgeHighlights: [{set:Edge.Set(...Util.flatten(paths.map(path => vertexArrayToEdges(path)))), color: Color.Normal}],
			newNodeHighlights: [stHighlight]
		}
		yield *visit(v, s);
	}
	yield {
		finalResult: paths,
		textOutput: `Found ${paths.length} s-t-paths`
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

	const path1Edges: Edge[] = vertexArrayToEdges(path1);
	const path2Edges: Edge[] = vertexArrayToEdges(path2);
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