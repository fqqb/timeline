export type PathSegment = ArcSegment | LineSegment | MoveSegment | QuadraticCurveSegment;

export interface LineSegment {
    type: 'line';
    x: number;
    y: number;
}

export interface MoveSegment {
    type: 'move';
    x: number;
    y: number;
}

export interface QuadraticCurveSegment {
    type: 'quadraticCurve',
    cpx: number;
    cpy: number;
    x: number;
    y: number;
}

export interface ArcSegment {
    type: 'arc',
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    radius: number;
}
