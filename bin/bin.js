"use strict";

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _get = function get(_x17, _x18, _x19) { var _again = true; _function: while (_again) { var object = _x17, property = _x18, receiver = _x19; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x17 = parent; _x18 = property; _x19 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var test = "a";

var ActualSet = (function () {
    function ActualSet(hasher, source) {
        _classCallCheck(this, ActualSet);

        this.map = new Map();
        if (hasher[ActualSet.hash]) this.hasher = hasher[ActualSet.hash];else this.hasher = hasher;
        if (source !== undefined) for (var e of source) {
            this.add(e);
        }
    }

    _createClass(ActualSet, [{
        key: "add",
        value: function add(item) {
            this.map.set(this.hasher(item), item);
            return this;
        }
    }, {
        key: "clear",
        value: function clear() {
            this.map.clear();
            return this;
        }
    }, {
        key: "delete",
        value: function _delete(item) {
            return this.map["delete"](this.hasher(item));
        }
    }, {
        key: "entries",
        value: function entries() {
            var realIt = this.map.values();
            var it = {
                next: realIt.next.bind(realIt),
                "return": realIt["return"].bind(realIt),
                "throw": realIt["throw"].bind(realIt)
            };
            var it2 = it;
            it2[Symbol.iterator] = function () {
                return it2;
            };
            return it2;
        }
    }, {
        key: Symbol.iterator,
        value: function value() {
            return this.map.values();
        }
    }, {
        key: "has",
        value: function has(item) {
            return this.map.has(this.hasher(item));
        }
    }, {
        key: "forEach",
        value: function forEach(callbackfn) {
            var thisArg = arguments.length <= 1 || arguments[1] === undefined ? this : arguments[1];

            for (var v of this) {
                callbackfn.call(thisArg, v, v);
            }
        }
    }, {
        key: "keys",
        value: function keys() {
            return this.map.values();
        }
    }, {
        key: "values",
        value: function values() {
            return this.map.values();
        }
    }, {
        key: "some",
        value: function some(predicate) {
            for (var t of this.map.values()) {
                if (predicate(t)) return true;
            }return false;
        }
    }, {
        key: "size",
        get: function get() {
            return this.map.size;
        }
    }, {
        key: "asPredicate",
        get: function get() {
            return this.has.bind(this);
        }
    }, {
        key: Symbol.toStringTag,
        get: function get() {
            return this.map[Symbol.toStringTag];
        }
    }]);

    return ActualSet;
})();

ActualSet.hash = Symbol("hasher for ActualSet");
var Util;
(function (Util) {
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r | 0) + componentToHex(g | 0) + componentToHex(b | 0);
    }
    Util.rgbToHex = rgbToHex;
    // Based on http://stackoverflow.com/a/565282/64009
    function intersect(a, b) {
        function cross(_ref, p2) {
            var x = _ref.x;
            var y = _ref.y;

            return x * p2.y - y * p2.x;
        }
        // Check if the segments are exactly the same (or just reversed).
        if (a[0] === b[0] && a[1] === b[1] || a[0] === b[1] && a[1] === b[0]) return true;
        // Represent the segments as p + tr and q + us, where t and u are scalar
        // parameters.
        var p = a[0],
            r = { x: a[1].x - p.x, y: a[1].y - p.y },
            q = b[0],
            s = { x: b[1].x - q.x, y: b[1].y - q.y };
        var rxs = cross(r, s),
            q_p = { x: q.x - p.x, y: q.y - p.y },
            t = cross(q_p, s) / rxs,
            u = cross(q_p, r) / rxs,
            epsilon = 1e-6;
        return t > epsilon && t < 1 - epsilon && u > epsilon && u < 1 - epsilon;
    }
    Util.intersect = intersect;
    function findIntersection(line1a, line1b, line2a, line2b) {
        var denominator = (line2b.y - line2a.y) * (line1b.x - line1a.x) - (line2b.x - line2a.x) * (line1b.y - line1a.y);
        if (denominator == 0) {
            return null;
        }
        var a = line1a.y - line2a.y;
        var b = line1a.x - line2a.x;
        var numerator1 = (line2b.x - line2a.x) * a - (line2b.y - line2a.y) * b;
        var numerator2 = (line1b.x - line1a.x) * a - (line1b.y - line1a.y) * b;
        a = numerator1 / denominator;
        b = numerator2 / denominator;
        return {
            // if we cast these lines infinitely in both directions, they intersect here:
            x: line1a.x + a * (line1b.x - line1a.x),
            y: line1a.y + a * (line1b.y - line1a.y),
            /*
                    // it is worth noting that this should be the same as:
                    x = line2a.x + (b * (line2b.x - line2a.x));
                    y = line2a.x + (b * (line2b.y - line2a.y));
                    */
            // if line1 is a segment and line2 is infinite, they intersect if:
            onLine1: a > 0 && a < 1,
            // if line2 is a segment and line1 is infinite, they intersect if:
            onLine2: b > 0 && b < 1
        };
    }
    Util.findIntersection = findIntersection;
    ;
    function array(size, supplier) {
        var arr = new Array(size);
        for (var i = 0; i < arr.length; i++) {
            arr[i] = supplier(i);
        }return arr;
    }
    Util.array = array;
    function shuffle(array) {
        var currentIndex = array.length;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            var randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            var _ref2 = [array[randomIndex], array[currentIndex]];
            array[currentIndex] = _ref2[0];
            array[randomIndex] = _ref2[1];
        }
        return array;
    }
    Util.shuffle = shuffle;
    function flatten(array) {
        return array.reduce(function (a, b) {
            return a.concat(b);
        }, []);
    }
    Util.flatten = flatten;
    function randomChoice(array) {
        return array[Math.random() * array.length | 0];
    }
    Util.randomChoice = randomChoice;
    function lineCenter(p, q) {
        return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    }
    Util.lineCenter = lineCenter;
    function linePerpendicular(p, q) {
        var _lineDistance = lineDistance(p, q);

        var _lineDistance2 = _slicedToArray(_lineDistance, 3);

        var dx = _lineDistance2[0];
        var dy = _lineDistance2[1];
        var dist = _lineDistance2[2];

        dx /= dist, dy /= dist;
        return { x: dy, y: -dx };
    }
    Util.linePerpendicular = linePerpendicular;
    function lineDistance(_ref3, _ref4) {
        var x1 = _ref3.x;
        var y1 = _ref3.y;
        var x2 = _ref4.x;
        var y2 = _ref4.y;

        var dx = x1 - x2,
            dy = y1 - y2;
        var dist = Math.sqrt(dx * dx + dy * dy);
        dx /= dist, dy /= dist;
        return [dx, dy, dist];
    }
    Util.lineDistance = lineDistance;
    function polygonConvex(p) {
        console.log(p);
        var l = p.length;
        for (var i = 0; i < l; i++) {
            var p1 = p[i],
                p2 = p[(i + 1) % l],
                p3 = p[(i + 2) % l];
            if (!pointsConvex(p1, p2, p3)) return false;
        }
        return true;
    }
    Util.polygonConvex = polygonConvex;
    function pointsConvex(_ref5, _ref6, _ref7) {
        var x0 = _ref5.x;
        var y0 = _ref5.y;
        var x1 = _ref6.x;
        var y1 = _ref6.y;
        var x2 = _ref7.x;
        var y2 = _ref7.y;

        var dx1 = x1 - x0;
        var dy1 = y1 - y0;
        var dx2 = x2 - x1;
        var dy2 = y2 - y1;
        var zcrossproduct = dx1 * dy2 - dy1 * dx2;
        return zcrossproduct <= 0;
    }
    Util.pointsConvex = pointsConvex;
    /** warning: sign and stuff incorrect */
    function findAngle(p1, p2, p3) {
        // invert y because of screen coordinates
        return (Math.atan2(-(p1.y - p2.y), p1.x - p2.x) - Math.atan2(-(p3.y - p2.y), p3.x - p2.x)) * 180 / Math.PI;
    }
    Util.findAngle = findAngle;
    function polygonCentroid(vertices) {
        var l = vertices.length;
        var centroid = { x: 0, y: 0 };
        var signedArea = 0.0;
        var x0 = 0.0; // Current vertex X
        var y0 = 0.0; // Current vertex Y
        var x1 = 0.0; // Next vertex X
        var y1 = 0.0; // Next vertex Y
        var a = 0.0; // Partial signed area
        // For all vertices except last
        for (var i = 0; i < vertices.length; ++i) {
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
        centroid.x /= 6.0 * signedArea;
        centroid.y /= 6.0 * signedArea;
        return centroid;
    }
    Util.polygonCentroid = polygonCentroid;
    function sqr(x) {
        return x * x;
    }
    function dist2(v, w) {
        return sqr(v.x - w.x) + sqr(v.y - w.y);
    }
    Util.dist2 = dist2;
    function projectPointToSegment(p, v, w) {
        var l2 = dist2(v, w);
        if (l2 == 0) return v;
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        if (t < 0) return v;
        if (t > 1) return w;
        return { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
    }
    Util.projectPointToSegment = projectPointToSegment;
    function distToSegmentSquared(p, v, w) {
        return dist2(p, projectPointToSegment(p, v, w));
    }
    Util.distToSegmentSquared = distToSegmentSquared;
    function polygonKernel(points) {
        var searchDuration = 100; //ms
        var abortDuration = 2000; //ms
        // find kernel of containing facet. (lul)
        var minx = points.reduce(function (min, p) {
            return Math.min(min, p.x);
        }, Infinity);
        var maxx = points.reduce(function (max, p) {
            return Math.max(max, p.x);
        }, -Infinity);
        var miny = points.reduce(function (min, p) {
            return Math.min(min, p.y);
        }, Infinity);
        var maxy = points.reduce(function (max, p) {
            return Math.max(max, p.y);
        }, -Infinity);
        var pointsForVisPoly = points.map(function (p) {
            return [p.x, p.y];
        }).reverse();
        var inxMap = new Map(pointsForVisPoly.map(function (v, i) {
            return ["" + v, i];
        }));
        var polyIsSame = function polyIsSame(poly) {
            if (pointsForVisPoly.length !== poly.length) return false;
            var offset = inxMap.get(poly[0] + "");
            for (var i = 0; i < poly.length; i++) {
                var p1 = poly[i];
                var p2 = pointsForVisPoly[(i + offset) % poly.length];
                if (!p2) return false;
                if (p1[0] !== p2[0] || p1[1] !== p2[1]) return false;
            }
            return true;
        };
        var segments = VisibilityPolygon.convertToSegments([pointsForVisPoly]);
        var results = [];
        console.log("searching for ", points, segments);
        var before = performance.now();
        while (true) {
            var x = Math.random() * (maxx - minx) + minx;
            var y = Math.random() * (maxy - miny) + miny;
            if (VisibilityPolygon.inPolygon([x, y], pointsForVisPoly)) {
                if (performance.now() - before > abortDuration) break;
                try {
                    if (polyIsSame(VisibilityPolygon.compute([x, y], segments))) {
                        results.push({ x: x, y: y });
                        if (performance.now() - before > searchDuration) break;
                    }
                } catch (e) {
                    // sometimes fails when point to close to edge
                    continue;
                }
            }
        }
        console.log("found " + results.length + " results");
        function minDistance(p) {
            var min = Infinity;
            for (var i = 0; i < points.length; i++) {
                var p2 = points[i],
                    p3 = points[(i + 1) % points.length];
                var cur = distToSegmentSquared(p, p2, p3);
                if (cur < min) min = cur;
            }
            //	const cur = (p2.x - p.x) * (p2.x - p.x) + (p2.y - p.y) * (p2.y - p.y);
            //if (cur < min) min = cur;
            return min;
        }
        if (results.length <= 0) return null;
        // results.splice(1000);
        // find point with max distance to poly
        results.sort(function (a, b) {
            return minDistance(b) - minDistance(a);
        });
        /*{//debug
            const min = Math.sqrt(Math.min(...results.map(r => minDistance(r))));
            const max = Math.sqrt(Math.max(...results.map(r => minDistance(r))));
            sigmainst.graph.nodes().filter(p => p.id.startsWith("debug_")).forEach(n => sigmainst.graph.dropNode(n.id));
            for(const p of results) {
                const color = (Math.sqrt(minDistance(p))-min)/(max-min) * 255;
                sigmainst.graph.addNode({
                    x: p.x,
                    y:p.y,
                    size: 1,
                    color: rgbToHex(color,color,color),
                    id:"debug_"+Math.random(),
                });
            }
        }*/
        console.log("result has minDist to polygon of " + minDistance(results[0]));
        return results[0];
    }
    Util.polygonKernel = polygonKernel;
})(Util || (Util = {}));

var Edge = (function () {
    function Edge(v1, v2) {
        var _this = this;

        _classCallCheck(this, Edge);

        this.v1 = v1;
        this.v2 = v2;
        this.toString = function () {
            return _this.id;
        };
    }

    _createClass(Edge, [{
        key: "toSigma",
        value: function toSigma() {
            return { size: 0.7, id: this.id, source: "" + this.v1.id, target: "" + this.v2.id };
        }
    }, {
        key: "id",
        get: function get() {
            return "e" + this.v1.id + "-" + this.v2.id;
        }
    }], [{
        key: "undirected",
        value: function undirected(v1, v2) {
            if (v1.id > v2.id) {
                return new Edge(v2, v1);
            }
            return new Edge(v1, v2);
        }
    }, {
        key: "ordered",
        value: function ordered(v1, v2) {
            return new Edge(v1, v2);
        }
    }, {
        key: ActualSet.hash,
        value: function value(e) {
            if (!(e instanceof Edge)) throw new Error("assertion error");
            return e.id;
        }
    }, {
        key: "Set",
        value: function Set() {
            for (var _len = arguments.length, e = Array(_len), _key = 0; _key < _len; _key++) {
                e[_key] = arguments[_key];
            }

            return new ActualSet(Edge, e);
        }
    }, {
        key: "Path",
        value: function Path(path) {
            var wrapAround = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            var pathEdges = [];
            for (var i = 0; i < path.length - 1; i++) {
                pathEdges.push(Edge.undirected(path[i], path[i + 1]));
            }if (wrapAround && path.length > 1) pathEdges.push(Edge.undirected(path[path.length - 1], path[0]));
            return pathEdges;
        }
    }]);

    return Edge;
})();

var Vertex = (function () {
    function Vertex() {
        var _this2 = this;

        _classCallCheck(this, Vertex);

        this.toString = function () {
            return _this2.sigmaId;
        };
        this.id = Vertex.counter++;
    }

    _createClass(Vertex, [{
        key: "sigmaId",
        get: function get() {
            return "" + this.id;
        }
    }], [{
        key: ActualSet.hash,
        value: function value(v) {
            if (!(v instanceof Vertex)) throw new Error("assertion error");
            return v.sigmaId;
        }
    }, {
        key: "Set",
        value: function Set() {
            for (var _len2 = arguments.length, v = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                v[_key2] = arguments[_key2];
            }

            return new ActualSet(Vertex, v);
        }
    }]);

    return Vertex;
})();

Vertex.counter = 0;

var Graph = (function () {
    function Graph() {
        var V = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
        var E = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

        _classCallCheck(this, Graph);

        this.V = Vertex.Set.apply(Vertex, _toConsumableArray(V));
        this.E = new Map(E);
        for (var v of this.V) {
            if (!this.E.has(v)) this.E.set(v, []);
        }
    }

    _createClass(Graph, [{
        key: "subgraph",
        value: function subgraph(subV) {
            return new Graph(subV, new Map(this.E));
        }
    }, {
        key: "union",
        value: function union(g2) {
            return new Graph(Vertex.Set.apply(Vertex, [].concat(_toConsumableArray(this.V), _toConsumableArray(g2.V))), new Map([].concat(_toConsumableArray(this.E), _toConsumableArray(g2.E))));
        }
    }, {
        key: "hasEdgeUndirected",
        value: function hasEdgeUndirected(v, to) {
            if (this.getEdgesUndirected(v).indexOf(to) >= 0 && this.getEdgesUndirected(to).indexOf(v) >= 0) return true;else return false;
        }
    }, {
        key: "addVertex",
        value: function addVertex(v) {
            this.V.add(v);
            if (!this.E.has(v)) this.E.set(v, []);
        }
    }, {
        key: "addEdgeUndirected",
        value: function addEdgeUndirected(from, to) {
            console.log("adding (" + from + "," + to + ")");
            if (this.hasEdgeUndirected(from, to)) throw from + " to " + to + " already exists";
            this.getEdgesUndirected(from).push(to);
            this.getEdgesUndirected(to).push(from);
        }
    }, {
        key: "getEdgesUndirected",
        value: function getEdgesUndirected(v) {
            if (!v || !this.V.has(v)) throw new Error("graph does not contain " + v);
            return this.E.get(v);
        }
    }, {
        key: "getAllEdgesUndirected",
        value: function getAllEdgesUndirected() {
            var out = Edge.Set();
            for (var v1 of this.V) {
                for (var v2 of this.getEdgesUndirected(v1)) {
                    var e = Edge.undirected(v1, v2);
                    if (!out.has(e)) out.add(e);
                }
            }return out;
        }
    }, {
        key: "getVertices",
        value: function getVertices() {
            return this.V;
        }
    }, {
        key: "getSomeVertex",
        value: function getSomeVertex() {
            return this.V.values().next().value;
        }
    }, {
        key: "getRandomVertex",
        value: function getRandomVertex() {
            return Util.randomChoice([].concat(_toConsumableArray(this.V)));
        }
    }, {
        key: "getVertexById",
        value: function getVertexById(id) {
            for (var v of this.V) {
                if (v.id === id) return v;
            }return null;
        }
    }, {
        key: "getEdgeIndex",
        value: function getEdgeIndex(v1, v2) {
            var edges = this.getEdgesUndirected(v1);
            for (var i = 0; i < edges.length; i++) {
                if (edges[i] === v2) return i;
            }
            throw "(" + v1 + "," + v2 + ") does not exist";
        }
    }, {
        key: "removeEdgeUndirected",
        value: function removeEdgeUndirected(v1, v2) {
            this.getEdgesUndirected(v1).splice(this.getEdgeIndex(v1, v2), 1);
            this.getEdgesUndirected(v2).splice(this.getEdgeIndex(v2, v1), 1);
        }

        /*removeVertex(v: Vertex) {
            this.V.delete(v);
            // todo
        }*/
    }, {
        key: "sortEdges",
        value: function sortEdges(mapper) {
            var _this3 = this;

            var _loop = function (v1) {
                _this3.E.set(v1, _this3.E.get(v1).sort(function (v2a, v2b) {
                    return mapper(v1, v2a) - mapper(v1, v2b);
                }));
            };

            for (var v1 of this.V) {
                _loop(v1);
            }
        }
    }, {
        key: "setPositionMap",
        value: function setPositionMap(map) {
            this.positionMap = map;
            console.log("bef");
            //for(var e of this.E) console.log(e[0]+" -> "+e[1])
            this.sortEdges(function (v1, v2) {
                var p1 = map(v1);
                var p2 = map(v2);

                var angle = -Math.atan2(p2.y - p1.y, p2.x - p1.x); // counter clockwise
                // console.log(`angle between ${v1} and ${v2} is ${angle*180/Math.PI}`);
                return angle;
            });
            //for(var e of this.E) console.log(e[0]+" -> "+e[1])
        }
    }, {
        key: "toSigma",
        value: function toSigma() {
            var posMap = this.positionMap || function (v) {
                return { x: Math.random(), y: Math.random() };
            };
            var nodes = [].concat(_toConsumableArray(this.V)).map(function (v) {
                var pos = posMap(v);
                return { id: "" + v.id, x: pos.x, y: pos.y, original_x: pos.x, original_y: pos.y, size: 1, label: "" + v.id };
            });
            var edges = [];
            for (var e of this.getAllEdgesUndirected()) {
                edges.push(e.toSigma());
            }
            return { nodes: nodes, edges: edges };
        }
    }, {
        key: "draw",
        value: function draw(sigmainst) {
            if (!sigmainst) throw Error("no sigmainst passed");
            var s = this.toSigma();
            sigmainst.graph.read(s);
            sigmainst.refresh();
            if (!this.positionMap) {
                sigmainst.configForceAtlas2({ slowDown: 1 });
                sigmainst.startForceAtlas2();
                setTimeout(function () {
                    return sigmainst.stopForceAtlas2();
                }, 2000);
            }
        }
    }, {
        key: "serialize",
        value: function serialize() {
            var map = {};
            var pos = {};
            for (var v of this.getVertices()) {
                map[v.id] = [];
                if (this.positionMap) pos[v.id] = this.positionMap(v);
                for (var v2 of this.getEdgesUndirected(v)) {
                    map[v.id].push(v2.id);
                }
            }
            if (this.positionMap) return JSON.stringify({ v: map, pos: pos });else return JSON.stringify({ v: map });
        }
    }, {
        key: "n",
        get: function get() {
            return this.V.size;
        }
    }, {
        key: "m",
        get: function get() {
            return this.E.size;
        }
    }], [{
        key: "deserialize",
        value: function deserialize(json) {
            var data = JSON.parse(json);
            var vs = new Map();
            for (var vid of Object.keys(data.v)) {
                var v = new Vertex();
                vs.set(+vid, v);
            }
            var g = new PlanarGraph(vs.values());
            for (var v1id of Object.keys(data.v)) {
                for (var v2id of data.v[+v1id]) {
                    var v1 = vs.get(+v1id);
                    var v2 = vs.get(v2id);
                    if (!g.hasEdgeUndirected(v1, v2)) g.addEdgeUndirected(v1, v2);
                }
            }if (data.pos) {
                var map = new Map(Object.keys(data.pos).map(function (v) {
                    return [vs.get(+v), data.pos[+v]];
                }));
                g.setPositionMap(map.get.bind(map));
            }
            return g;
        }
    }, {
        key: "randomGraph",
        value: function randomGraph() {
            var n = arguments.length <= 0 || arguments[0] === undefined ? 10 : arguments[0];
            var m = arguments.length <= 1 || arguments[1] === undefined ? 15 : arguments[1];

            var verts = [];
            for (var i = 0; i < n; i++) {
                verts.push(new Vertex());
            }var g = new Graph(verts);
            for (var i = 0; i < m; i++) {
                var e = undefined;
                var v1 = undefined,
                    v2 = undefined;
                do {
                    v1 = Math.random() * n | 0;
                    v2 = Math.random() * n | 0;
                } while (g.hasEdgeUndirected(verts[v1], verts[v2]));
                g.addEdgeUndirected(verts[v1], verts[v2]);
            }
            return g;
        }

        /** complete graph of size n */
    }, {
        key: "K",
        value: function K(n) {
            var vertices = [];
            for (var i = 0; i < n; i++) {
                vertices.push(new Vertex());
            }var g = new Graph(new Set(vertices));
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < n; j++) {
                    if (i != j) g.addEdgeUndirected(vertices[i], vertices[j]);
                }
            }
        }
    }, {
        key: "fromAscii",
        value: function fromAscii(ascii) {
            var data = ascii.split('\n');
            while (data[0].length == 0 || data[0].match(/_+/)) data.shift();
            var toPos = new Map();
            var V = [];
            for (var _ref83 of data.entries()) {
                var _ref82 = _slicedToArray(_ref83, 2);

                var y = _ref82[0];
                var line = _ref82[1];

                for (var _ref93 of line.split('').entries()) {
                    var _ref92 = _slicedToArray(_ref93, 2);

                    var x = _ref92[0];
                    var char = _ref92[1];

                    if (char.match(/\d/) !== null) {
                        var v = new Vertex();
                        var id = +char;
                        V[id] = v;
                        console.log(id, x, y);
                        toPos.set(v, { x: x, y: y });
                    }
                }
            }
            var G = new PlanarGraph(V.filter(function (v) {
                return v != null;
            }));

            for (var _len3 = arguments.length, edges = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                edges[_key3 - 1] = arguments[_key3];
            }

            for (var path of edges) {
                for (var i = 0; i < path.length - 1; i++) {
                    G.addEdgeUndirected(V[path[i]], V[path[i + 1]]);
                }
            }
            G.setPositionMap(toPos.get.bind(toPos));
            return G;
        }
    }]);

    return Graph;
})();

var PlanarGraph = (function (_Graph) {
    _inherits(PlanarGraph, _Graph);

    function PlanarGraph() {
        var V = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
        var E = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

        _classCallCheck(this, PlanarGraph);

        _get(Object.getPrototypeOf(PlanarGraph.prototype), "constructor", this).call(this, V, E);
    }

    /**TODO: don't modify self graph */

    _createClass(PlanarGraph, [{
        key: "triangulateAll",
        value: function* triangulateAll() {
            var g = this;
            var invert = function invert(_ref10) {
                var _ref102 = _slicedToArray(_ref10, 2);

                var v1 = _ref102[0];
                var v2 = _ref102[1];
                return [v2, v1];
            };
            var Θ = function Θ(_ref11) {
                var _ref112 = _slicedToArray(_ref11, 2);

                var v1 = _ref112[0];
                var v2 = _ref112[1];
                return [v1, g.getNextEdge(v1, v2)];
            };
            var Θstar = function Θstar(e) {
                return Θ(invert(e));
            };
            var s = function s(_ref12) {
                var _ref122 = _slicedToArray(_ref12, 2);

                var _s = _ref122[0];
                var t = _ref122[1];
                return _s;
            },
                t = function t(_ref13) {
                var _ref132 = _slicedToArray(_ref13, 2);

                var s = _ref132[0];
                var _t = _ref132[1];
                return _t;
            };
            var equal = function equal(_ref14, _ref15) {
                var _ref142 = _slicedToArray(_ref14, 2);

                var s1 = _ref142[0];
                var t1 = _ref142[1];

                var _ref152 = _slicedToArray(_ref15, 2);

                var s2 = _ref152[0];
                var t2 = _ref152[1];
                return s1 === s2 && t1 === t2;
            };
            var triangulate = function* triangulate(e, é) {
                if (equal(e, é)) return;
                if (s(e) !== s(é)) throw "assertion error";
                var v = s(e);
                var é́ = Θstar(é);
                if (equal(Θstar(é́), invert(e))) return; // already triangular
                yield {
                    textOutput: "triangulating " + e + " and " + é,
                    resetNodeHighlights: Color.Normal,
                    resetEdgeHighlights: Color.Normal,
                    newNodeHighlights: [{ set: Vertex.Set(v, t(e), t(é)), color: Color.PrimaryHighlight }],
                    newEdgeHighlights: [{ set: Edge.Set.apply(Edge, _toConsumableArray(Edge.Path(g.getFacet(v, t(e)), true))), color: Color.SecondaryHighlight }]
                };
                if (g.hasEdgeUndirected(v, t(é́)) || t(é́) === v) {
                    g.addEdgeUndirected(t(é), t(e), v, g.getPrevEdge(t(e), v));
                    sigmainst.graph.addEdge(Edge.undirected(t(é), t(e)).toSigma());
                    return;
                }
                // todo: sonderfall
                var eneu = [s(é), t(é́)];
                g.addEdgeUndirected(s(eneu), t(eneu), g.getPrevEdge(s(eneu), t(é)), t(é));
                sigmainst.graph.addEdge(Edge.undirected(s(eneu), t(eneu)).toSigma());
                yield* triangulate(e, eneu);
            };
            for (var v of Util.shuffle([].concat(_toConsumableArray(g.V)))) {
                for (var v2 of g.getEdgesUndirected(v)) {
                    if (v === v2) continue;
                    var e = [v, v2];
                    var é = Θ(e);
                    yield* triangulate(e, é);
                }
            }
            yield {
                textOutput: "Triangulation complete.",
                resetEdgeHighlights: Color.Normal,
                resetNodeHighlights: Color.Normal,
                finalResult: g
            };
            return g;
        }
    }, {
        key: "getNextEdges",
        value: function* getNextEdges(v1, v2) {
            var v2start = v2;
            v2 = this.getNextEdge(v1, v2);
            while (v2 !== v2start) {
                yield v2;
                v2 = this.getNextEdge(v1, v2);
            }
        }
    }, {
        key: "getNextEdge",
        value: function getNextEdge(v1, v2) {
            if (!this.hasEdgeUndirected(v1, v2)) throw new Error("does not have edge " + v1 + " - " + v2);
            var edges = this.getEdgesUndirected(v1);
            var nextEdge = (this.getEdgeIndex(v1, v2) + 1) % edges.length;
            return edges[nextEdge];
        }
    }, {
        key: "getPrevEdge",
        value: function getPrevEdge(v1, v2) {
            if (!this.hasEdgeUndirected(v1, v2)) throw new Error("does not have edge " + v1 + " - " + v2);
            var edges = this.getEdgesUndirected(v1);
            var nextEdge = (this.getEdgeIndex(v1, v2) - 1 + edges.length) % edges.length;
            return edges[nextEdge];
        }
    }, {
        key: "getEdgesBetween",
        value: function* getEdgesBetween(vbefore, vref, vafter) {
            if (!this.hasEdgeUndirected(vref, vafter)) throw new Error("does not have edge " + vref + " - " + vafter);
            if (vafter === vbefore) throw new Error("same edge");
            var edge = this.getNextEdge(vref, vbefore);
            while (edge !== vafter) {
                yield edge;
                edge = this.getNextEdge(vref, edge);
            }
        }
    }, {
        key: "edgeIsBetween",
        value: function edgeIsBetween(base, target, rightEdge, leftEdge) {
            for (var edge of this.getEdgesBetween(rightEdge, base, leftEdge)) {
                if (edge === target) return true;
            }return false;
        }
    }, {
        key: "addEdgeUndirected",
        value: function addEdgeUndirected(from, to, afterEdge1, afterEdge2) {
            console.log("adding (" + from + "," + to + ") after " + from + "," + afterEdge1 + " and " + to + "," + afterEdge2);
            if (this.hasEdgeUndirected(from, to)) throw from + " to " + to + " already exists";
            if (afterEdge1 === undefined && afterEdge2 === undefined) {
                this.getEdgesUndirected(from).push(to);
                this.getEdgesUndirected(to).push(from);
            } else {
                var edges1 = this.getEdgesUndirected(from);
                var index1 = afterEdge1 === undefined ? edges1.length - 1 : this.getEdgeIndex(from, afterEdge1);
                edges1.splice(index1 + 1, 0, to);
                var edges2 = this.getEdgesUndirected(to);
                var index2 = afterEdge2 === undefined ? edges2.length - 1 : this.getEdgeIndex(to, afterEdge2);
                edges2.splice(index2 + 1, 0, from);
            }
            console.log(from + ": " + this.getEdgesUndirected(from) + ", " + to + ": " + this.getEdgesUndirected(to));
        }
    }, {
        key: "getFacet",
        value: function getFacet(v, v2) {
            var facet = [v, v2];
            while (facet[facet.length - 1] !== v) facet.push(this.getPrevEdge(facet[facet.length - 1], facet[facet.length - 2]));
            facet.pop(); //no duplicate point
            return facet;
        }
    }, {
        key: "facetsAround",
        value: function* facetsAround(v) {
            for (var v2 of this.getEdgesUndirected(v)) {
                yield this.getFacet(v, v2);
            }
        }
    }, {
        key: "checkTriangulated",
        value: function checkTriangulated() {
            var _this4 = this;

            var has = function has(v1, v2) {
                return _this4.hasEdgeUndirected(v1, v2);
            };
            for (var v1 of this.getVertices()) {
                for (var v2 of this.getEdgesUndirected(v1)) {
                    var v3 = this.getNextEdge(v1, v2);
                    if (!has(v1, v3) || this.getPrevEdge(v1, v3) !== v2) return false;
                    if (!has(v2, v3) || this.getNextEdge(v2, v3) !== v1) return false;
                    if (!has(v2, v1) || this.getPrevEdge(v2, v1) !== v3) return false;
                    if (!has(v3, v1) || this.getNextEdge(v3, v1) !== v2) return false;
                    if (!has(v3, v2) || this.getPrevEdge(v3, v2) !== v1) return false;
                }
            }
            return true;
        }
    }, {
        key: "clone",
        value: function clone() {
            var e = [].concat(_toConsumableArray(this.E));
            for (var x of e) {
                x[1] = x[1].slice();
            } // clone edge arrays
            return new PlanarGraph(this.V, e);
        }
    }], [{
        key: "randomPlanarGraph",
        value: function randomPlanarGraph(n) {
            var positionMap = new Map();
            var toPos = positionMap.get.bind(positionMap);
            var V = Util.array(n, function (i) {
                return new Vertex();
            });
            var E = new ActualSet(function (_ref16) {
                var _ref162 = _slicedToArray(_ref16, 2);

                var v1 = _ref162[0];
                var v2 = _ref162[1];
                return v1.id + "|" + v2.id;
            });
            var G = new PlanarGraph(V);
            for (var v of V) {
                positionMap.set(v, { x: Math.random(), y: Math.random() });
            }function addPlanarLink(edge, links) {
                if (!links.has(edge) && edge[0] !== edge[1] && !links.some(function (other) {
                    return Util.intersect([toPos(edge[0]), toPos(edge[1])], [toPos(other[0]), toPos(other[1])]);
                })) E.add(edge);
            }
            for (var point of V) {
                addPlanarLink([point, V[Math.random() * n | 0]], E);
            }for (var i = 0; i < n; i++) {
                for (var j = 1 + 1; j < n; j++) {
                    addPlanarLink([V[i], V[j]], E);
                }
            }
            for (var _ref173 of E) {
                var _ref172 = _slicedToArray(_ref173, 2);

                var v1 = _ref172[0];
                var v2 = _ref172[1];

                G.addEdgeUndirected(v1, v2);
            }G.setPositionMap(toPos);
            return G;
        }
    }]);

    return PlanarGraph;
})(Graph);

var sigmainst, g;
var Color = {
    PrimaryHighlight: "#ff0000",
    SecondaryHighlight: "#00ff00",
    TertiaryHighlight: "#0000ff",
    Normal: "#000000",
    GrayedOut: "#999999",
    Invisible: "#ffffff"
};

var GraphAlgorithm = function GraphAlgorithm(name, supplier) {
    _classCallCheck(this, GraphAlgorithm);

    this.name = name;
    this.supplier = supplier;
};

var Algorithms = [new GraphAlgorithm("Breadth First Search", function () {
    return BFS.run(g);
}), new GraphAlgorithm("vertex disjunct Menger algorithm", function () {
    return mengerVertexDisjunct(g, g.getRandomVertex(), g.getRandomVertex());
}), new GraphAlgorithm("Triangulate Graph", function () {
    return g.triangulateAll();
}), new GraphAlgorithm("Find planar embedding", function () {
    return findPlanarEmbedding(g);
}), new GraphAlgorithm("Tree Lemma (incomplete) (Separator ≤ 2h + 1)", function () {
    return treeLemma(g, StepByStep.complete(BFS.run(g)));
})];
var GUI;
(function (GUI) {
    GUI.currentAlgorithm = null;
    var timeout = undefined;
    var running = false;
    function algorithmStep() {
        if (GUI.currentAlgorithm) {
            if (StepByStep.step(GUI.currentAlgorithm, algorithmCallback)) {
                onAlgorithmFinish();
            }
        } else {
            onAlgorithmFinish();
        }
    }
    GUI.algorithmStep = algorithmStep;
    function algorithmCallback() {
        if (running) setTimeout(function () {
            return !running || algorithmStep();
        }, 200);
    }
    GUI.algorithmCallback = algorithmCallback;
    function onAlgorithmFinish() {
        $("#stepButton").prop("disabled", true);
        $("#runButton").prop("disabled", true);
        if (running) {
            algorithmRunToggle();
        }
        GUI.currentAlgorithm = null;
    }
    GUI.onAlgorithmFinish = onAlgorithmFinish;
    function algorithmRunToggle() {
        var btn = $("#runButton");
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
    GUI.algorithmRunToggle = algorithmRunToggle;
    function startAlgorithm() {
        if (running) algorithmRunToggle();
        var select = $("#selectAlgorithm")[0];
        var algo = Algorithms[+select.value];
        $("#stepButton").prop("disabled", false);
        $("#runButton").prop("disabled", false);
        GUI.currentAlgorithm = algo.supplier();
        algorithmStep();
    }
    GUI.startAlgorithm = startAlgorithm;
    GUI.Macros = {
        bfsPositions: function bfsPositions() {
            addPositions('bfs', StepByStep.complete(BFS.run(g)).getTreeOrderPositions());
            animatePositions('bfs');
        },
        bfsHighlights: function bfsHighlights() {
            highlightEdges(g, Color.Normal, { set: StepByStep.complete(BFS.run(g)).getUsedEdges(), color: Color.PrimaryHighlight });
            sigmainst.refresh();
        },
        forceLayout: function forceLayout() {
            sigmainst.configForceAtlas2({ slowDown: 1 });
            sigmainst.startForceAtlas2();
            setTimeout(function () {
                return sigmainst.stopForceAtlas2();
            }, 2000);
        },
        noHighlights: function noHighlights() {
            highlightEdges(g, Color.Normal);
            highlightVertices(g, Color.Normal);
            sigmainst.refresh();
        },
        loadGraph: function loadGraph() {
            onAlgorithmFinish();
            sigmainst.graph.clear();
            g = TestGraphs[$("#selectGraph").val()](+$("#vertexCount").val());
            g.draw(sigmainst);
        },
        replaceGraph: function replaceGraph(newg) {
            sigmainst.graph.clear();
            g = newg;
            g.draw(sigmainst);
        }
    };
    function init() {
        sigma.renderers.def = sigma.renderers.canvas;
        sigmainst = new sigma({
            container: $("#graph-container")[0],
            settings: {
                minEdgeSize: 0.5, maxEdgeSize: 4,
                doubleClickEnabled: false,
                enableEdgeHovering: true,
                edgeHoverSizeRatio: 1
            }
        });
        sigmainst.bind("doubleClickEdge", function (ev) {
            //console.log(e.data.edge);
            //for debug purposes
            var e = ev.data.edge;
            var s = g.getVertexById(+e.source),
                t = g.getVertexById(+e.target);
            sigmainst.graph.dropEdge(e.id);
            g.removeEdgeUndirected(s, t);
            sigmainst.refresh();
        });
        sigma.plugins.dragNodes(sigmainst, sigmainst.renderers[0]);
        var algoSelect = $("#selectAlgorithm")[0];
        $(algoSelect).change(function () {
            return onAlgorithmFinish();
        });
        for (var _ref183 of Algorithms.entries()) {
            var _ref182 = _slicedToArray(_ref183, 2);

            var i = _ref182[0];
            var algo = _ref182[1];

            algoSelect.add(new Option(algo.name, i + "", i === 0));
        }
        var graphSelect = $("#selectGraph")[0];
        for (var _ref193 of Object.keys(TestGraphs).entries()) {
            var _ref192 = _slicedToArray(_ref193, 2);

            var i = _ref192[0];
            var _g = _ref192[1];

            graphSelect.add(new Option(_g, _g, i === 0));
        }
        GUI.Macros.loadGraph();
    }
    GUI.init = init;
})(GUI || (GUI = {}));

var StepByStep = (function () {
    function StepByStep() {
        _classCallCheck(this, StepByStep);
    }

    _createClass(StepByStep, null, [{
        key: "step",
        value: function step(algo, callback) {
            var next = algo.next();
            if (next.done) return true;
            StepByStep.applyState(next.value, callback);
            return next.value.finalResult !== undefined;
        }
    }, {
        key: "complete",
        value: function complete(algo) {
            for (var state of algo) {
                if (state.finalResult !== undefined) return state.finalResult;
            }
            throw "did not get final result";
        }
    }, {
        key: "applyState",
        value: function applyState(state, callback) {
            highlightEdges.apply(undefined, [g, state.resetEdgeHighlights].concat(_toConsumableArray(state.newEdgeHighlights || [])));
            highlightVertices.apply(undefined, [g, state.resetNodeHighlights].concat(_toConsumableArray(state.newNodeHighlights || [])));
            $("#stateOutput").text(state.textOutput);
            sigmainst.refresh();
            if (state.changePositions !== undefined) {
                addPositions("_temp", state.changePositions);
                animatePositions("_temp", [].concat(_toConsumableArray(state.changePositions.keys())).map(function (v) {
                    return v.sigmaId;
                }), 400, callback);
            } else {
                callback();
            }
        }
    }]);

    return StepByStep;
})();

var Tree = (function () {
    function Tree(element) {
        var children = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

        _classCallCheck(this, Tree);

        this.element = element;
        this.children = children;
    }

    _createClass(Tree, [{
        key: "preOrder",
        value: function preOrder(fn) {
            var parent = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
            var layer = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
            var childIndex = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];

            fn(this, parent, layer, childIndex);
            for (var _ref203 of this.children.entries()) {
                var _ref202 = _slicedToArray(_ref203, 2);

                var i = _ref202[0];
                var child = _ref202[1];

                child.preOrder(fn, this, layer + 1, i);
            }
        }
    }, {
        key: "postOrder",
        value: function postOrder(fn) {
            var parent = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
            var layer = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
            var childIndex = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];

            for (var _ref213 of this.children.entries()) {
                var _ref212 = _slicedToArray(_ref213, 2);

                var i = _ref212[0];
                var child = _ref212[1];

                child.postOrder(fn, this, layer + 1, i);
            }fn(this, parent, layer, childIndex);
        }
    }, {
        key: "toArray",
        value: function toArray() {
            var layers = new Array(this.depth);
            function add(t, parent, layer, childIndex) {
                if (!layers[layer]) layers[layer] = [];
                layers[layer].push({ element: t.element, parent: parent ? parent.element : null });
            }
            this.preOrder(add);
            return layers;
        }
    }, {
        key: "depth",
        get: function get() {
            if (this.children.length == 0) return 1;
            return 1 + Math.max.apply(Math, _toConsumableArray(this.children.map(function (c) {
                return c.depth;
            })));
        }
    }]);

    return Tree;
})();

var BFS = (function () {
    function BFS(tree /*, public usedEdges: ActualSet<Edge>*/) {
        _classCallCheck(this, BFS);

        this.tree = tree;
    }

    _createClass(BFS, [{
        key: "getTreeOrderPositions",
        value: function getTreeOrderPositions() {
            var layers = this.treeLayers;
            var repos = new Map();
            for (var _ref223 of layers.entries()) {
                var _ref222 = _slicedToArray(_ref223, 2);

                var i = _ref222[0];
                var layer = _ref222[1];

                for (var _ref233 of layer.entries()) {
                    var _ref232 = _slicedToArray(_ref233, 2);

                    var n = _ref232[0];
                    var _ref232$1 = _ref232[1];
                    var element = _ref232$1.element;
                    var _parent = _ref232$1.parent;

                    repos.set(element, { x: (n + 1) / (_parent == null ? 2 : layer.length + 1), y: i / layers.length });
                }
            }
            return repos;
        }
    }, {
        key: "getUsedEdges",
        value: function getUsedEdges() {
            var edges = Edge.Set();
            for (var layer of this.treeLayers) {
                for (var _ref242 of layer) {
                    var element = _ref242.element;
                    var _parent2 = _ref242.parent;

                    if (_parent2 == null) continue;
                    edges.add(Edge.undirected(_parent2, element));
                }
            }return edges;
        }
    }, {
        key: "treeLayers",
        get: function get() {
            if (this._treeLayers === undefined) this._treeLayers = this.tree.toArray();
            return this._treeLayers;
        }
    }], [{
        key: "run",
        value: function* run(G) {
            var root = arguments.length <= 1 || arguments[1] === undefined ? G.getSomeVertex() : arguments[1];
            return yield* (function* () {
                var rootTree = new Tree(root);
                var visited = Vertex.Set(root);
                var queue = [rootTree];
                var usedEdges = Edge.Set();
                while (queue.length > 0) {
                    var v = queue.shift();
                    var currentChildren = Edge.Set();
                    for (var child of G.getEdgesUndirected(v.element)) {
                        if (visited.has(child)) continue;
                        var t = new Tree(child);
                        v.children.push(t);
                        var edge = Edge.undirected(v.element, child);
                        usedEdges.add(edge);
                        currentChildren.add(edge);
                        queue.push(t);
                        visited.add(child);
                    }
                    yield {
                        resetEdgeHighlights: Color.GrayedOut,
                        resetNodeHighlights: Color.GrayedOut,
                        newNodeHighlights: [{ set: Vertex.Set(v.element), color: Color.PrimaryHighlight }, { set: Vertex.Set.apply(Vertex, _toConsumableArray(queue.map(function (v) {
                                return v.element;
                            }))), color: Color.SecondaryHighlight }, { set: visited, color: Color.Normal }],
                        newEdgeHighlights: [{ set: currentChildren, color: Color.PrimaryHighlight }, { set: usedEdges, color: Color.Normal }],
                        textOutput: "Found " + visited.size + " of " + G.n + " vertices"
                    };
                }
                var bfs = new BFS(rootTree);
                yield {
                    resetEdgeHighlights: Color.GrayedOut,
                    resetNodeHighlights: Color.Normal,
                    newEdgeHighlights: [{ set: bfs.getUsedEdges(), color: Color.Normal }],
                    finalResult: bfs,
                    textOutput: "BFS successful"
                };
            })();
        }
    }]);

    return BFS;
})();

function addPositions(prefix, posMap) {
    var nodes = sigmainst.graph.nodes();
    var ys = nodes.map(function (n) {
        return n.y;
    }),
        xs = nodes.map(function (n) {
        return n.x;
    });
    for (var _ref253 of posMap) {
        var _ref252 = _slicedToArray(_ref253, 2);

        var vertex = _ref252[0];
        var _ref252$1 = _ref252[1];
        var x = _ref252$1.x;
        var y = _ref252$1.y;

        var node = sigmainst.graph.nodes(vertex.sigmaId);
        node[prefix + "_x"] = x;
        node[prefix + "_y"] = y;
    }
}
function animatePositions(prefix, nodes, duration, callback) {
    if (duration === undefined) duration = 1000;

    sigma.plugins.animate(sigmainst, {
        x: prefix + '_x', y: prefix + '_y'
    }, {
        easing: 'cubicInOut',
        duration: duration,
        nodes: nodes,
        onComplete: callback
    });
}
function highlightEdges(g, othersColor) {
    for (var _len4 = arguments.length, edgeSets = Array(_len4 > 2 ? _len4 - 2 : 0), _key4 = 2; _key4 < _len4; _key4++) {
        edgeSets[_key4 - 2] = arguments[_key4];
    }

    var _loop2 = function (_edge) {
        var result = edgeSets.find(function (_ref26) {
            var set = _ref26.set;
            return set.has(_edge);
        });
        var edge = sigmainst.graph.edges(_edge.id);
        if (result !== undefined) {
            edge.color = result.color;
            edge.size = 3;
        } else if (othersColor !== undefined) {
            edge.color = othersColor;
            edge.size = 1;
        }
    };

    for (var _edge of g.getAllEdgesUndirected()) {
        _loop2(_edge);
    }
}
function highlightVertices(g, othersColor) {
    for (var _len5 = arguments.length, vertexSets = Array(_len5 > 2 ? _len5 - 2 : 0), _key5 = 2; _key5 < _len5; _key5++) {
        vertexSets[_key5 - 2] = arguments[_key5];
    }

    var _loop3 = function (vertex) {
        var result = vertexSets.find(function (_ref27) {
            var set = _ref27.set;
            return set.has(vertex);
        });
        var node = sigmainst.graph.nodes(vertex.sigmaId);
        if (result !== undefined) {
            node.color = result.color;
        } else if (othersColor !== undefined) {
            node.color = othersColor;
        }
    };

    for (var vertex of g.getVertices()) {
        _loop3(vertex);
    }
}
function resetPositions(G) {
    animatePositions("original");
}
function* findPlanarEmbedding(g) {
    var embeddedSubgraph = new PlanarGraph();
    StepByStep.complete(g.triangulateAll());
    sigmainst.graph.clear();
    g.draw(sigmainst);
    yield {
        textOutput: "Triangulated"
    };
    var map = new Map();
    var vertices = [].concat(_toConsumableArray(g.getVertices()));
    var v1 = Util.randomChoice(vertices);
    var v2 = Util.randomChoice(g.getEdgesUndirected(v1));
    var v3 = g.getNextEdge(v1, v2);
    embeddedSubgraph.addVertex(v1);
    embeddedSubgraph.addVertex(v2);
    embeddedSubgraph.addVertex(v3);
    embeddedSubgraph.addEdgeUndirected(v1, v2);
    embeddedSubgraph.addEdgeUndirected(v2, v3);
    embeddedSubgraph.addEdgeUndirected(v3, v1);
    window._g = embeddedSubgraph;
    function facetContainsAt(f, v, i) {
        var c = f.vertices.length;
        var vafter = f.vertices[(i + c - 1) % c];
        var vref = f.vertices[i % c];
        var vbefore = f.vertices[(i + 1) % c];
        for (var vert of g.getEdgesBetween(vbefore, vref, vafter)) {
            if (vert === v) return true;
        }return false;
    }
    function facetContains(f, v) {
        for (var i = 0; i < f.vertices.length; i++) {
            if (facetContainsAt(f, v, i)) return true;
        }
        return false;
    }
    var facets = new Set();
    facets.add({ vertices: [v1, v2, v3], isOuter: true });
    facets.add({ vertices: [v1, v3, v2] });
    map.set(v1, { x: 0, y: 0 });
    map.set(v2, { x: 1, y: 0 });
    map.set(v3, { x: 0.5, y: Math.sqrt(3) / 2 });
    yield {
        textOutput: "Added initial facet",
        changePositions: map,
        resetEdgeHighlights: "#cccccc",
        resetNodeHighlights: "#cccccc",
        newEdgeHighlights: [{ set: embeddedSubgraph.getAllEdgesUndirected(), color: Color.Normal }],
        newNodeHighlights: [{ set: Vertex.Set.apply(Vertex, _toConsumableArray(map.keys())), color: Color.Normal }]
    };
    var halfEmbeddedEdges = function halfEmbeddedEdges(v) {
        return g.getEdgesUndirected(v).filter(function (w) {
            return map.has(w);
        });
    };

    var _loop4 = function* () {
        var v = vertices.find(function (v) {
            if (map.has(v)) return false;var e = halfEmbeddedEdges(v);return e.length >= 2;
        });
        if (v === undefined) throw "bläsius error";
        var edges = halfEmbeddedEdges(v);
        yield {
            textOutput: "next vertex to insert",
            resetEdgeHighlights: "#cccccc",
            resetNodeHighlights: "#cccccc",
            changePositions: map,
            newEdgeHighlights: [{ set: embeddedSubgraph.getAllEdgesUndirected(), color: Color.Normal }],
            newNodeHighlights: [{ set: Vertex.Set(v), color: Color.PrimaryHighlight }, { set: Vertex.Set.apply(Vertex, _toConsumableArray(edges)), color: Color.SecondaryHighlight }, { set: Vertex.Set.apply(Vertex, _toConsumableArray(map.keys())), color: Color.Normal }]
        };
        var neighbour = edges[0];
        var containingFacets = [].concat(_toConsumableArray(facets)).filter(function (facet) {
            var i = facet.vertices.indexOf(neighbour);
            if (i < 0) return false;
            return facetContainsAt(facet, v, i);
        });
        if (containingFacets.length !== 1) throw new Error("internal error " + containingFacets);
        var containingFacet = containingFacets[0];
        console.log(v, "is in", containingFacet);
        var points = containingFacet.vertices.map(function (v) {
            return map.get(v);
        });
        var point = undefined;
        if (Util.polygonConvex(points)) {
            console.log("is convex");
            point = Util.polygonCentroid(points);
        } else {
            point = Util.polygonKernel(points);
        }
        if (!point) {
            yield {
                finalResult: null,
                textOutput: "Embedding error: timeout while searching for new polygon position"
            };
            return {
                v: undefined
            };
        }
        map.set(v, point);
        yield {
            textOutput: "moved vertex to new position",
            resetEdgeHighlights: "#cccccc",
            resetNodeHighlights: "#cccccc",
            changePositions: map,
            newEdgeHighlights: [{ set: embeddedSubgraph.getAllEdgesUndirected(), color: Color.Normal }],
            newNodeHighlights: [{ set: Vertex.Set(v), color: Color.PrimaryHighlight }, { set: Vertex.Set.apply(Vertex, _toConsumableArray(edges)), color: Color.SecondaryHighlight }, { set: Vertex.Set.apply(Vertex, _toConsumableArray(map.keys())), color: Color.Normal }]
        };
        var lastEdge = undefined;
        var edgesSet = Vertex.Set.apply(Vertex, _toConsumableArray(edges));
        embeddedSubgraph.addVertex(v);
        for (var _ref283 of containingFacet.vertices.entries()) {
            var _ref282 = _slicedToArray(_ref283, 2);

            var i = _ref282[0];
            var vertex = _ref282[1];

            if (edgesSet.has(vertex)) {
                embeddedSubgraph.addEdgeUndirected(v, vertex, lastEdge, containingFacet.vertices[(i + 1) % containingFacet.vertices.length]);
                lastEdge = vertex;
            }
        }
        yield {
            textOutput: "added new edges to vertex " + v,
            newEdgeHighlights: [{ set: Edge.Set.apply(Edge, _toConsumableArray([].concat(_toConsumableArray(edgesSet)).map(function (v2) {
                    return Edge.undirected(v, v2);
                }))), color: Color.PrimaryHighlight }]
        };
        facets["delete"](containingFacet);
        for (var facet of embeddedSubgraph.facetsAround(v)) {
            facets.add({ vertices: facet });
            yield {
                textOutput: "adding facets",
                resetEdgeHighlights: "#cccccc",
                newEdgeHighlights: [{ set: Edge.Set.apply(Edge, _toConsumableArray(Edge.Path(facet, true))), color: Color.PrimaryHighlight }, { set: embeddedSubgraph.getAllEdgesUndirected(), color: Color.Normal }]
            };
        }
        if (map.size % 1 == 0) {
            for (var it = 0; it < 1000; it++) {
                for (var _v of map.keys()) {
                    var poly = [];
                    var vPos = map.get(_v);
                    for (var w of embeddedSubgraph.getEdgesUndirected(_v)) {
                        poly.push.apply(poly, _toConsumableArray(embeddedSubgraph.getFacet(_v, w).slice(1)));
                    }
                    var force = { x: 0, y: 0 };
                    for (var e of Edge.Path(poly, true)) {
                        var p = Util.projectPointToSegment(vPos, map.get(e.v1), map.get(e.v2));
                        var dist2 = Util.dist2(vPos, p);
                        force.x += (p.x - vPos.x) / dist2;
                        force.y += (p.y - vPos.y) / dist2;
                    }
                    vPos.x -= force.x * 0.00001;
                    vPos.y -= force.y * 0.00001;
                    map.set(_v, vPos);
                }
            }
            yield {
                textOutput: "running force based algorithm",
                changePositions: map
            };
        }
    };

    while (map.size < vertices.length) {
        var _ret4 = yield* _loop4();

        if (typeof _ret4 === "object") return _ret4.v;
    }
    yield {
        textOutput: "Embedding successful",
        resetNodeHighlights: Color.Normal,
        resetEdgeHighlights: Color.Normal,
        finalResult: map
    };
}
function* mengerVertexDisjunct(orig_g, s, t) {
    yield {
        textOutput: "starting menger from " + s + " to " + t,
        resetEdgeHighlights: Color.Normal,
        resetNodeHighlights: Color.Normal,
        newNodeHighlights: [{ set: Vertex.Set(s, t), color: Color.TertiaryHighlight }]
    };
    var g = orig_g.clone();
    var foundPaths = [];

    var Info = function Info() {
        _classCallCheck(this, Info);
    };

    var infos = new Map();
    var pathId = 0;
    for (var startv of g.getEdgesUndirected(s)) {
        var p = Object.defineProperties({
            arr: [s, startv]
        }, {
            v: {
                get: function get() {
                    return this.arr[this.arr.length - 1];
                },
                set: function set(x) {
                    this.arr[this.arr.length - 1] = x;
                },
                configurable: true,
                enumerable: true
            },
            prev: {
                get: function get() {
                    return this.arr[this.arr.length - 2];
                },
                set: function set(x) {
                    this.arr[this.arr.length - 2] = x;
                },
                configurable: true,
                enumerable: true
            }
        });
        while (true) {
            if (p.v === p.arr[p.arr.length - 3]) {
                // edge iteration came full circle, go back
                p.arr.pop();
            }
            if (p.v === s) {
                // skip
                p.v = g.getNextEdge(p.prev, p.v);
                continue;
            }
            yield {
                textOutput: "exploring node " + p.v + " at index " + (p.arr.length - 1) + " of path " + (pathId + 1),
                resetEdgeHighlights: Color.Invisible,
                resetNodeHighlights: Color.GrayedOut,
                newEdgeHighlights: [{ set: Edge.Set.apply(Edge, _toConsumableArray(Edge.Path(p.arr))), color: Color.PrimaryHighlight }, { set: Edge.Set.apply(Edge, _toConsumableArray(Util.flatten(foundPaths.map(function (path) {
                        return Edge.Path(path);
                    })))), color: Color.Normal }, { set: g.getAllEdgesUndirected(), color: Color.GrayedOut }],
                newNodeHighlights: [{ set: Vertex.Set(p.v), color: Color.PrimaryHighlight }, { set: Vertex.Set(p.prev), color: Color.SecondaryHighlight }, { set: Vertex.Set(s, t), color: Color.TertiaryHighlight }, { set: Vertex.Set.apply(Vertex, _toConsumableArray(Util.flatten(foundPaths))), color: Color.Normal }]
            };
            if (p.v === t) {
                if (foundPaths[pathId]) throw Error("nooo");
                foundPaths[pathId] = p.arr;
                pathId++;
                break;
            }
            if (infos.has(p.v)) {
                // conflict

                var _infos$get = infos.get(p.v);

                var theirPathId = _infos$get.pathId;
                var theirPathIndex = _infos$get.pathIndex;

                var backtrackRemove = false;
                if (theirPathId == pathId) {
                    // conflict path is self
                    if (p.arr[theirPathIndex] === p.v) {
                        // did not backtrack out of that path => conflict from left
                        backtrackRemove = true;
                    } else {
                        // node already visited, but had to backtrack => ignore node
                        backtrackRemove = true;
                    }
                } else {
                    var otherPath = foundPaths[theirPathId];
                    if (!otherPath) throw Error("noo");
                    if (otherPath[theirPathIndex] === p.v) {
                        // node already contained in complete path
                        if (g.edgeIsBetween(p.v, p.prev, otherPath[theirPathIndex - 1], otherPath[theirPathIndex + 1])) {
                            // conflict from right => replace path segments
                            var myNewPath = otherPath.splice.apply(otherPath, [0, theirPathIndex + 1].concat(_toConsumableArray(p.arr)));
                            yield { textOutput: "replacing path segments" };
                            for (var v of myNewPath) {
                                v === s || (infos.get(v).pathId = pathId);
                            }for (var v of p.arr) {
                                v === s || (infos.get(v).pathId = theirPathId);
                            }for (var _ref293 of otherPath.entries()) {
                                var _ref292 = _slicedToArray(_ref293, 2);

                                var i = _ref292[0];
                                var v = _ref292[1];

                                v === s || v === t || (infos.get(v).pathIndex = i);
                            }p.arr = myNewPath;
                            // new iteration (resulting in conflict from left)
                            continue;
                        } else {
                            // conflict from left
                            backtrackRemove = true;
                        }
                    } else {}
                }
                if (backtrackRemove) {
                    var next = g.getNextEdge(p.prev, p.v);
                    if (next === p.v) break;
                    // g.removeEdgeUndirected(p.prev, p.v);
                    p.v = next;
                    if (p.prev === s) break; // backtracked into start, abort iteration
                    continue;
                }
            }
            infos.set(p.v, { pathIndex: p.arr.length - 1, pathId: pathId });
            p.arr.push(g.getNextEdge(p.v, p.prev));
        }
    }
    yield {
        textOutput: "finished. found " + foundPaths.length + " paths from " + s + " to " + t,
        resetEdgeHighlights: Color.GrayedOut,
        resetNodeHighlights: Color.GrayedOut,
        newEdgeHighlights: [{ set: Edge.Set.apply(Edge, _toConsumableArray(Util.flatten(foundPaths.map(function (path) {
                return Edge.Path(path);
            })))), color: Color.Normal }],
        newNodeHighlights: [{ set: Vertex.Set(s, t), color: Color.TertiaryHighlight }, { set: Vertex.Set.apply(Vertex, _toConsumableArray(Util.flatten(foundPaths))), color: Color.Normal }],
        finalResult: foundPaths
    };
}
function* treeLemma(G, bfs) {
    G = StepByStep.complete(G.triangulateAll());
    var parentMap = new Map();
    for (var layer of bfs.treeLayers) {
        for (var _ref302 of layer) {
            var element = _ref302.element;
            var _parent3 = _ref302.parent;

            parentMap.set(element, _parent3);
        }
    }var leaves = [];
    bfs.tree.preOrder(function (t) {
        if (t.children.length === 0) leaves.push(t.element);
    });
    var childrenCount = new Map();
    leaves.forEach(function (leaf) {
        return childrenCount.set(leaf, [1, [leaf]]);
    });
    bfs.tree.postOrder(function (node) {
        var outp = node.children.reduce(function (_ref31, node) {
            var _ref312 = _slicedToArray(_ref31, 2);

            var sum = _ref312[0];
            var children = _ref312[1];

            var _childrenCount$get = childrenCount.get(node.element);

            var _childrenCount$get2 = _slicedToArray(_childrenCount$get, 2);

            var sum2 = _childrenCount$get2[0];
            var children2 = _childrenCount$get2[1];

            return [sum + sum2, children.concat(children2)];
        }, [1, [node.element]]);
        childrenCount.set(node.element, outp);
    });
    /**  elements to the left / the right of the edge from this node to it's parent */
    var rightLeftCounts = new Map();
    bfs.tree.postOrder(function (node, parent, layer, childIndex) {
        var vertex = node.element;
        if (parent === null) return; // root
        var parentVertex = parent.element;
        var edges = G.getEdgesUndirected(parentVertex);
        var parentParentIndex = edges.indexOf(parentMap.get(parentVertex));
        var selfIndex = edges.indexOf(vertex);
        if (parentParentIndex === selfIndex || parentParentIndex < 0 && selfIndex < 0) throw new Error("assertion error");
        var leftNodes = [];
        var rightNodes = [];
        if (parentParentIndex > selfIndex) {
            leftNodes = edges.slice(selfIndex + 1, parentParentIndex);
            rightNodes = edges.slice(parentParentIndex + 1).concat(edges.slice(0, selfIndex));
        } else {
            leftNodes = edges.slice(selfIndex + 1).concat(edges.slice(0, parentParentIndex));
            rightNodes = edges.slice(parentParentIndex + 1, selfIndex);
        }
        var leftCount = leftNodes.reduce(function (sum, node) {
            return sum + childrenCount.get(node)[0];
        }, 0);
        var rightCount = rightNodes.reduce(function (sum, node) {
            return sum + childrenCount.get(node)[0];
        }, 0);
        rightLeftCounts.set(vertex, [leftCount, rightCount, leftNodes, rightNodes]);
    });
    var treeEdges = bfs.getUsedEdges();
    var nonTreeEdges = [].concat(_toConsumableArray(G.getAllEdgesUndirected())).filter(function (e) {
        return !treeEdges.has(e);
    });
    var nonTreeEdge = Util.randomChoice(nonTreeEdges);
    var path1 = [nonTreeEdge.v1],
        path2 = [nonTreeEdge.v2];
    while (parentMap.get(path1[0]) !== undefined) path1.unshift(parentMap.get(path1[0]));
    var path1Set = new Set(path1);
    // only go up until find crossing with other path
    while (true) {
        var _parent4 = parentMap.get(path2[0]);
        if (_parent4 === undefined) break;
        if (path1Set.has(_parent4)) {
            path2.unshift(_parent4);
            break;
        }
        path2.unshift(_parent4);
    }
    // find common root
    var commonRoot = path2[0];
    while (path1[0] !== commonRoot) path1.shift();
    console.log(commonRoot, path2[1], path1[1], parentMap.get(commonRoot));
    if (parentMap.get(commonRoot) != null && G.edgeIsBetween(commonRoot, path2[1], path1[1], parentMap.get(commonRoot))) {} else {
        var _ref32 = [path2, path1];
        path1 = _ref32[0];
        path2 = _ref32[1];
    }
    var path1Edges = Edge.Path(path1);
    var path2Edges = Edge.Path(path2);
    yield {
        resetEdgeHighlights: Color.GrayedOut,
        resetNodeHighlights: Color.Normal,
        newNodeHighlights: [{ set: Vertex.Set(nonTreeEdge.v1, nonTreeEdge.v2), color: Color.PrimaryHighlight }, { set: Vertex.Set(commonRoot), color: Color.SecondaryHighlight }],
        newEdgeHighlights: [{ set: Edge.Set(nonTreeEdge), color: Color.PrimaryHighlight }, { set: Edge.Set.apply(Edge, _toConsumableArray(path1Edges)), color: Color.SecondaryHighlight }, { set: Edge.Set.apply(Edge, _toConsumableArray(path2Edges)), color: Color.TertiaryHighlight }, { set: treeEdges, color: Color.Normal }],
        textOutput: "found initial nontree edge and circle"
    };
    var innerSize = 0;
    var innerNodes = [];
    for (var _ref333 of path1.entries()) {
        var _ref332 = _slicedToArray(_ref333, 2);

        var i = _ref332[0];
        var v = _ref332[1];

        if (i == 0 || i == 1) continue; //skip root

        var _rightLeftCounts$get = rightLeftCounts.get(v);

        var _rightLeftCounts$get2 = _slicedToArray(_rightLeftCounts$get, 4);

        var left = _rightLeftCounts$get2[0];
        var right = _rightLeftCounts$get2[1];
        var l = _rightLeftCounts$get2[2];
        var r = _rightLeftCounts$get2[3];

        innerSize += right;
        innerNodes = innerNodes.concat(Util.flatten(r.map(function (node) {
            return childrenCount.get(node)[1].concat([node]);
        })));
    }
    console.log(innerSize);
    yield {
        resetNodeHighlights: Color.GrayedOut,
        newNodeHighlights: [{ set: Vertex.Set.apply(Vertex, _toConsumableArray(innerNodes)), color: Color.PrimaryHighlight }],
        textOutput: "found inner node count"
    };
    yield { textOutput: "not implemented",
        finalResult: { v1: null, v2: null, s: null } };
}
function PST(G) {
    var n = G.n;
    if (n < 5) throw "n is not >= 5";
    var tree = StepByStep.complete(BFS.run(G, G.getSomeVertex()));
    var layers = tree.treeLayers.map(function (layer) {
        return layer.map(function (ele) {
            return ele.element;
        });
    });
    layers.push([]); // empty layer for M
    var nodeCount = 0;
    var middleLayer = -1;
    var flat = Util.flatten;
    for (var _ref343 of layers.entries()) {
        var _ref342 = _slicedToArray(_ref343, 2);

        var i = _ref342[0];
        var layer = _ref342[1];

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
    };
    var m = middleLayer;
    while (layers[m].length > Math.sqrt(n)) m--;
    var M = middleLayer;
    while (layers[M].length > Math.sqrt(n)) m++;
    var A1 = layers.slice(0, m);
    var A2 = layers.slice(m + 1, M);
    var A3 = flat(layers.slice(M + 1));
    if (A2.reduce(function (sum, layer) {
        return sum + layer.length;
    }, 0) <= 2 / 3 * n) {
        return { v1: flat(A2), v2: flat([].concat(_toConsumableArray(A1), _toConsumableArray(A2))), s: [].concat(_toConsumableArray(layers[m]), _toConsumableArray(layers[M])) };
    }
    // |A2| > 2/3 n

    var _StepByStep$complete = StepByStep.complete(treeLemma(null, null));

    var v1_b = _StepByStep$complete.v1;
    var v2_b = _StepByStep$complete.v2;
    var s_b = _StepByStep$complete.s;

    return null;
}
function matching(G) {
    if (G.n >= 5) {
        var _PST = PST(G);

        var v1 = _PST.v1;
        var v2 = _PST.v2;
        var s = _PST.s;

        var g1 = G.subgraph(v1),
            g2 = G.subgraph(v2);
        var m1 = matching(g1),
            m2 = matching(g2);
        var m = m1.concat(m2);
        var _g2 = g1.union(g2);
        for (var v of s) {}
        return m;
    }
    return null;
}
document.addEventListener('DOMContentLoaded', function () {
    return GUI.init();
});
var TestGraphs = {
    sampleGraph: function sampleGraph(n) {
        return PlanarGraph.deserialize('{"pos":{"0":{"x":0.9567903648770978,"y":0.3044487369932432},"1":{"x":0.5267492126137234,"y":0.21662801926871264},"2":{"x":0.2551442743421186,"y":0.8647535207902879},"3":{"x":0.8148150562351227,"y":0.62403542667612},"4":{"x":0.27880682578244786,"y":0.31370799625250245},"5":{"x":0.7160496241363572,"y":0.43164859540039985},"6":{"x":1.0627574430663982,"y":0.3236239040423752},"7":{"x":0.21193439779890877,"y":0.3281112884335724},"8":{"x":0.15946526199643962,"y":0.3816092308204037},"9":{"x":0.7479426282515835,"y":0.1703317229724163},"10":{"x":0.6903294595273036,"y":0.8410584275795667},"11":{"x":0.6903294595273037,"y":0.21251279293126402},"12":{"x":1.1284132082129015,"y":0.6281506530135685},"13":{"x":0.04288239870220423,"y":0.3120930497534573},"14":{"x":1.000000241420308,"y":0.5952288423139801},"15":{"x":0.5720167023256576,"y":0.4165886546887164},"16":{"x":0.10905373936269469,"y":0.3610330991331609},"17":{"x":0.7541154677577564,"y":0.2464634102152147},"18":{"x":0.9259261673462336,"y":0.5005786365526633},"19":{"x":0.4783953031487029,"y":0.43716478637595924},"20":{"x":0.39819170275191407,"y":0.3277391303798239},"21":{"x":0.4846114558383339,"y":0.08802719622344515},"22":{"x":0.6485231048427522,"y":0.7397751514799893},"23":{"x":0.07559850439429283,"y":0.12803629226982594},"24":{"x":0.24376398022286594,"y":0.012793667381629348},"25":{"x":0.5401236982104313,"y":0.8204822958923239},"26":{"x":0.6944879990482105,"y":0.31539345136747804},"27":{"x":0.03208110178820789,"y":0.38012674218043685},"28":{"x":0.41358048833388805,"y":0.722144210244272},"29":{"x":0.8993361520115286,"y":0.009576051961630583}},"v":{"0":[17,22,18,14,12,6,29],"1":[20,15,26,17,11,9,29,21,24,23],"2":[10,25,28,19,7,8,27],"3":[22,12,18],"4":[19,20,23],"5":[22,17,26,15],"6":[12],"7":[8,19,23],"8":[23],"9":[11,29],"10":[12,22,25],"11":[17],"12":[14,22],"13":[27,16,23],"14":[18],"15":[26],"16":[23],"17":[26,29],"18":[],"19":[28,25,20],"20":[23],"21":[29,24],"22":[],"23":[24],"24":[29],"25":[],"26":[],"27":[],"28":[],"29":[]}}');
    },
    random: function random(n) {
        return PlanarGraph.randomPlanarGraph(+document.getElementById("vertexCount").value);
    },
    triangles: function triangles(n) {
        // aspect ratio
        var r = 4 / 3;
        var w = Math.sqrt(n * r) | 0,
            h = w / r | 0;
        var g = new PlanarGraph();
        var layers = Util.array(h, function (i) {
            return Util.array(w, function (j) {
                var v = new Vertex();
                g.addVertex(v);
                return v;
            });
        });
        var pos = new Map();
        for (var l = 0; l < layers.length; l++) {
            var la = layers[l],
                lb = layers[l + 1];
            for (var i of la.keys()) {
                pos.set(la[i], { y: l, x: i + l % 2 / 2 });
                if (lb) g.addEdgeUndirected(la[i], lb[i]);
                if (i > 0) {
                    g.addEdgeUndirected(la[i], la[i - 1]);
                    if (lb) {
                        if (l % 2) g.addEdgeUndirected(la[i - 1], lb[i]);else g.addEdgeUndirected(la[i], lb[i - 1]);
                    }
                }
            }
        }
        g.setPositionMap(pos.get.bind(pos));
        return g;
    },
    circle: function circle(n) {
        var vs = Util.array(n, function (i) {
            return new Vertex();
        });
        var map = new Map();
        var g = new PlanarGraph(vs);
        Edge.Path(vs, true).forEach(function (e) {
            return g.addEdgeUndirected(e.v1, e.v2);
        });
        for (var _ref353 of vs.entries()) {
            var _ref352 = _slicedToArray(_ref353, 2);

            var i = _ref352[0];
            var v = _ref352[1];

            var r = 0.5;
            var φ = i / n * 2 * Math.PI;
            map.set(v, { x: r * Math.cos(φ), y: r * Math.sin(φ) });
        }
        g.setPositionMap(map.get.bind(map));
        return g;
    }
};
//# sourceMappingURL=tmp.js.map
//# sourceMappingURL=bin.js.map