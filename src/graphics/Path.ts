import { Bounds } from './Bounds';
import { PathSegment } from './PathSegment';
import { Point } from './Point';

export class Path {

    segments: PathSegment[] = [];

    constructor(x: number, y: number) {
        this.segments.push({ x, y, line: false });
    }

    static fromPoints(points: Point[]) {
        const path = new Path(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            path.lineTo(points[i].x, points[i].y);
        }
        return path;
    }

    getBoundingBox(): Bounds {
        const tl: Point = { x: this.segments[0].x, y: this.segments[0].y };
        const br: Point = { x: this.segments[0].x, y: this.segments[0].y };
        for (let i = 0; i < this.segments.length; i++) {
            const point = this.segments[i];
            if (point.x < tl.x) {
                tl.x = point.x;
            }
            if (point.x > br.x) {
                br.x = point.x;
            }
            if (point.y < tl.y) {
                tl.y = point.y;
            }
            if (point.y > br.y) {
                br.y = point.y;
            }
        }
        return { x: tl.x, y: tl.y, width: br.x - tl.x, height: br.y - tl.y };
    }

    lineTo(x: number, y: number) {
        this.segments.push({ x, y, line: true });
        return this;
    }

    moveTo(x: number, y: number) {
        this.segments.push({ x, y, line: false });
        return this;
    }

    closePath() {
        const orig = this.segments[0];
        this.segments.push({ x: orig.x, y: orig.y, line: true });
        return this;
    }

    translate(x: number, y: number) {
        for (const point of this.segments) {
            point.x += x;
            point.y += y;
        }
        return this;
    }
}
