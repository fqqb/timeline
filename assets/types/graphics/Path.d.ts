import { Bounds } from './Bounds';
import { PathSegment } from './PathSegment';
import { Point } from './Point';
export declare class Path {
    segments: PathSegment[];
    constructor(x: number, y: number);
    static fromPoints(points: Point[]): Path;
    getBoundingBox(): Bounds;
    lineTo(x: number, y: number): this;
    moveTo(x: number, y: number): this;
    closePath(): this;
    translate(x: number, y: number): this;
}
