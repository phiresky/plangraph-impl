declare module VisibilityPolygon {
	type point = [number, number];
	type line = [point, point];
	type polygon = point[];
	function compute(position: point, segments: line[]): polygon;
	function inPolygon(position: point, polygon: polygon): boolean;
	function convertToSegments(polys: polygon[]): line[];
	function breakIntersections(segments: line[]): line[];
}