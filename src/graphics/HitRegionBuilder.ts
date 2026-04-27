import { Path } from '../graphics/Path';

export class HitRegionBuilder {

    constructor(private ctx: CanvasRenderingContext2D) {
    }

    addRect(x: number, y: number, width: number, height: number) {
        this.ctx.fillRect(x, y, width, height);
        return this;
    }

    addEllipse(cx: number, cy: number, rx: number, ry: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean) {
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, rx, ry, rotation, startAngle, endAngle, anticlockwise);
        this.ctx.fill();
    }

    addPath(path: Path) {
        this.ctx.beginPath();
        for (const segment of path.segments) {
            if (segment.type === 'line') {
                this.ctx.lineTo(segment.x, segment.y);
            } else if (segment.type === 'move') {
                this.ctx.moveTo(segment.x, segment.y);
            } else if (segment.type === 'quadraticCurve') {
                this.ctx.quadraticCurveTo(segment.cpx, segment.cpy, segment.x, segment.y);
            } else if (segment.type === 'arc') {
                this.ctx.arcTo(segment.x1, segment.y1, segment.x2, segment.y2, segment.radius);
            }
        }
        this.ctx.fill();
    }
}
