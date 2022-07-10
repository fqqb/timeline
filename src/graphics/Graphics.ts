import { EllipseFill } from './EllipseFill';
import { EllipseStroke } from './EllipseStroke';
import { FillStyle } from './FillStyle';
import { HitCanvas } from './HitCanvas';
import { HitRegionBuilder } from './HitRegionBuilder';
import { HitRegionSpecification } from './HitRegionSpecification';
import { PathFill } from './PathFill';
import { PathStroke } from './PathStroke';
import { shrink } from './positioning';
import { RectFill } from './RectFill';
import { RectStroke } from './RectStroke';
import { TextFill } from './TextFill';
import { TextMetrics } from './TextMetrics';


/**
 * Draw on an HTML5 canvas.
 *
 * This class wraps an HTML5 Canvas and 2D rendering context in a
 * slightly higher-level API, while also allowing to register hit
 * regions.
 */
export class Graphics {

    /**
     * Native draw context for the HTML5 Canvas.
     *
     * Can be used to draw directly without using any convenience API.
     */
    readonly ctx: CanvasRenderingContext2D;

    /**
     * Manages hit regions which connects DOM interactions to the Canvas.
     */
    readonly hitCanvas: HitCanvas;

    /**
     * Draw context matching the hit canvas.
     */
    readonly hitCtx: CanvasRenderingContext2D;

    constructor(readonly canvas: HTMLCanvasElement, hitCanvas?: HitCanvas) {
        this.ctx = canvas.getContext('2d')!;
        this.hitCanvas = hitCanvas ? hitCanvas : new HitCanvas();
        this.hitCtx = this.hitCanvas.ctx;
    }

    createChild(width: number, height: number) {
        const tmpHitCanvas = this.hitCanvas.createChild(width, height);
        const childCanvas = document.createElement('canvas');
        childCanvas.width = width;
        childCanvas.height = height;
        return new Graphics(childCanvas, tmpHitCanvas);
    }

    copy(g: Graphics, dx: number, dy: number) {
        this.ctx.drawImage(g.canvas, dx, dy);
        g.hitCanvas.transferTo(this.hitCtx, dx, dy, g.canvas.width, g.canvas.height);
    }

    clearHitCanvas() {
        this.hitCanvas.clear();
    }

    fillCanvas(fill: FillStyle) {
        this.ctx.fillStyle = fill;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    resize(width: number, height: number) {
        // Careful not to reset dimensions all the time (it does lots of stuff)
        if (this.ctx.canvas.width !== width || this.ctx.canvas.height !== height) {
            this.ctx.canvas.width = width;
            this.ctx.canvas.height = height;
            this.hitCanvas.ctx.canvas.width = width;
            this.hitCanvas.ctx.canvas.height = height;
        }
    }

    fillRect(fill: RectFill) {
        this.ctx.fillStyle = fill.fill;

        if (fill.rx || fill.ry) {
            roundRect(this.ctx, fill.x, fill.y, fill.width, fill.height, fill.rx || 0, fill.ry || 0);
            this.ctx.fill();
        } else {
            this.ctx.fillRect(fill.x, fill.y, fill.width, fill.height);
        }
    }

    fillEllipse(fill: EllipseFill) {
        this.ctx.fillStyle = fill.fill;

        this.ctx.beginPath();
        const startAngle = fill.startAngle ?? 0;
        const endAngle = fill.endAngle ?? (2 * Math.PI);
        this.ctx.ellipse(fill.cx, fill.cy, fill.rx, fill.ry, 0, startAngle,
            endAngle, fill.anticlockwise);
        this.ctx.fill();
    }

    fillText(fill: TextFill) {
        this.ctx.textBaseline = fill.baseline;
        this.ctx.textAlign = fill.align;
        this.ctx.font = fill.font;
        this.ctx.fillStyle = fill.color;

        this.ctx.fillText(fill.text, fill.x, fill.y);
    }

    measureText(text: string, font: string): TextMetrics {
        this.ctx.font = font;
        const fm = this.ctx.measureText(text);
        return { width: fm.width };
    }

    strokeRect(stroke: RectStroke) {
        if (stroke.dash) {
            this.ctx.setLineDash(stroke.dash);
        }
        this.ctx.lineWidth = stroke.lineWidth ?? 1;
        this.ctx.strokeStyle = stroke.color;
        this.ctx.lineJoin = stroke.lineJoin || 'miter';
        if (stroke.crispen && stroke.lineWidth) {
            const box = shrink(stroke, stroke.lineWidth / 2, stroke.lineWidth / 2);
            if (stroke.rx || stroke.ry) {
                roundRect(this.ctx, box.x, box.y, box.width, box.height, stroke.rx || 0, stroke.ry || 0);
                this.ctx.stroke();
            } else {
                this.ctx.strokeRect(box.x, box.y, box.width, box.height);
            }
        } else {
            if (stroke.rx || stroke.ry) {
                roundRect(this.ctx, stroke.x, stroke.y, stroke.width, stroke.height, stroke.rx || 0, stroke.ry || 0);
                this.ctx.stroke();
            } else {
                this.ctx.strokeRect(stroke.x, stroke.y, stroke.width, stroke.height);
            }
        }
        if (stroke.dash) {
            this.ctx.setLineDash([]);
        }
    }

    strokeEllipse(stroke: EllipseStroke) {
        if (stroke.dash) {
            this.ctx.setLineDash(stroke.dash);
        }
        this.ctx.lineWidth = stroke.lineWidth ?? 1;
        this.ctx.beginPath();
        const startAngle = stroke.startAngle ?? 0;
        const endAngle = stroke.endAngle ?? (2 * Math.PI);
        this.ctx.ellipse(stroke.cx, stroke.cy, stroke.rx, stroke.ry,
            0, startAngle, endAngle, stroke.anticlockwise);

        this.ctx.strokeStyle = stroke.color;
        this.ctx.stroke();
        if (stroke.dash) {
            this.ctx.setLineDash([]);
        }
    }

    strokePath(stroke: PathStroke) {
        if (stroke.dash) {
            this.ctx.setLineDash(stroke.dash);
        }
        this.ctx.beginPath();
        for (const segment of stroke.path.segments) {
            if (segment.line) {
                this.ctx.lineTo(segment.x, segment.y);
            } else {
                this.ctx.moveTo(segment.x, segment.y);
            }
        }
        this.ctx.lineWidth = stroke.lineWidth ?? 1;
        this.ctx.lineCap = stroke.lineCap || 'butt';
        this.ctx.lineJoin = stroke.lineJoin || 'miter';
        this.ctx.strokeStyle = stroke.color;
        this.ctx.stroke();

        if (stroke.dash) {
            this.ctx.setLineDash([]);
        }
    }

    fillPath(fill: PathFill) {
        this.ctx.beginPath();
        for (const segment of fill.path.segments) {
            if (segment.line) {
                this.ctx.lineTo(segment.x, segment.y);
            } else {
                this.ctx.moveTo(segment.x, segment.y);
            }
        }
        this.ctx.fillStyle = fill.fill;
        this.ctx.fill();
    }

    addHitRegion(region: HitRegionSpecification) {
        this.hitCanvas.beginHitRegion(region);
        return new HitRegionBuilder(this.hitCanvas.ctx);
    }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rx: number, ry: number) {
    ctx.beginPath();
    if (!rx && !ry) {
        ctx.rect(x, y, w, h);
    } else {
        if (w < 2 * rx) {
            rx = w / 2;
        }
        if (h < 2 * ry) {
            ry = h / 2;
        }
        ctx.moveTo(x + rx, y);
        ctx.lineTo(x + w - rx, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + ry);
        ctx.lineTo(x + w, y + h - ry);
        ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h);
        ctx.lineTo(x + rx, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - ry);
        ctx.lineTo(x, y + ry);
        ctx.quadraticCurveTo(x, y, x + rx, y);
    }
}
