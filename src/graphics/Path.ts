import { Bounds } from './Bounds';
import { MoveSegment, PathSegment } from './PathSegment';
import { Point } from './Point';

export class Path {

    segments: PathSegment[] = [];

    constructor(x: number, y: number) {
        this.segments.push({ x, y, type: 'move' });
    }

    static fromPoints(points: Point[]) {
        const path = new Path(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            path.lineTo(points[i].x, points[i].y);
        }
        return path;
    }

    getBoundingBox(): Bounds {
        if (this.segments.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        // Helper to update bounds
        const update = (x: number, y: number) => {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        };

        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];

            switch (seg.type) {
                case 'move':
                case 'line':
                    update(seg.x, seg.y);
                    break;

                case 'quadraticCurve':
                    // Include the control point and the end point
                    update(seg.cpx, seg.cpy);
                    update(seg.x, seg.y);
                    break;

                case 'arc':
                    // An arcTo is contained within the hull of:
                    // 1. The previous segment's end point (already tracked)
                    // 2. The corner point (x1, y1)
                    // 3. The destination point (x2, y2)
                    update(seg.x1, seg.y1);
                    update(seg.x2, seg.y2);
                    break;
            }
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
        this.segments.push({ x1, y1, x2, y2, radius, type: 'arc' });
        return this;
    }

    lineTo(x: number, y: number) {
        this.segments.push({ x, y, type: 'line' });
        return this;
    }

    moveTo(x: number, y: number) {
        this.segments.push({ x, y, type: 'move' });
        return this;
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
        this.segments.push({ cpx, cpy, x, y, type: 'quadraticCurve' });
        return this;
    }

    closePath() {
        if (this.segments.length === 0) return this;

        const first = this.segments[0] as MoveSegment;
        const startX = first.x;
        const startY = first.y;

        this.segments.push({
            type: 'line',
            x: startX,
            y: startY,
        });

        return this;
    }

    translate(x: number, y: number) {
        for (const seg of this.segments) {
            switch (seg.type) {
                case 'move':
                case 'line':
                    seg.x += x;
                    seg.y += y;
                    break;
                case 'quadraticCurve':
                    seg.x += x;
                    seg.y += y;
                    seg.cpx += x;
                    seg.cpy += y;
                    break;
                case 'arc':
                    seg.x1 += x;
                    seg.y1 += y;
                    seg.x2 += x;
                    seg.y2 += y;
                    break;
            }
        }
        return this;
    }
}
