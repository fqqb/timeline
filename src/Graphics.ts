import { HitCanvas } from './HitCanvas';
import { HitRegionSpecification } from './HitRegionSpecification';
import { Bounds, Point, shrink } from './positioning';
import * as utils from './utils';

/**
 * Style to use when filling shapes.
 */
export type FillStyle =
    /**
     * CSS color string.
     */
    string |
    /**
     * Linear or radial gradient.
     */
    CanvasGradient |
    /**
     * Repeating image.
     */
    CanvasPattern;

/**
 * Properties to be provided with {@link Graphics.fillRect}.
 */
export interface RectFill {
    /**
     * X-axis coordinate of the rectangle's starting point.
     */
    x: number;
    /**
     * Y-axis coordinate of the rectangle's starting point.
     */
    y: number;
    /**
     * The rectangle's width.
     */
    width: number;
    /**
     * The rectangle's height.
     */
    height: number;
    /**
     * Fill the rectangle with a color, gradient or pattern.
     */
    fill: FillStyle;
    /**
     * Corner radius on the x-axis.
     */
    rx?: number;
    /**
     * Corner radius on the y-axis.
     */
    ry?: number;
}

/**
 * Properties to be provided with {@link Graphics.fillEllipse}.
 */
export interface EllipseFill {
    /**
     * X-axis coordinate of the ellipse's center
     */
    cx: number;
    /**
     * Y-axis coordinate of the ellipse's center
     */
    cy: number;
    /**
     * The ellipse's X-radius.
     */
    rx: number;
    /**
     * The ellipse's Y-radius.
     */
    ry: number;
    /**
     * Fill the ellipse with a color, gradient or pattern.
     */
    fill: FillStyle;
    /**
     * Angle in radians at which the ellipse starts (measured clockwise from the positive x-axis).
     */
    startAngle?: number;
    /**
     * Angle in radians at which the ellipse ends (measured clockwise from the positive x-axis).
     */
    endAngle?: number;
    /**
     * If true, draw the ellipse anticlockwise.
     */
    anticlockwise?: boolean;
}

/**
 * Properties to be provided with {@link Graphics.strokeEllipse}.
 */
export interface EllipseStroke {
    /**
     * X-axis coordinate of the ellipse's center
     */
    cx: number;
    /**
     * Y-axis coordinate of the ellipse's center
     */
    cy: number;
    /**
     * The ellipse's X-radius.
     */
    rx: number;
    /**
     * The ellipse's Y-radius.
     */
    ry: number;
    /**
     * Stroke thickness.
     */
    lineWidth: number;
    /**
     * Stroke color.
     */
    color: string;
    /**
     * Angle in radians at which the ellipse starts (measured clockwise from the positive x-axis).
     */
    startAngle?: number;
    /**
     * Angle in radians at which the ellipse ends (measured clockwise from the positive x-axis).
     */
    endAngle?: number;
    /**
     * If true, draw the ellipse anticlockwise.
     */
    anticlockwise?: boolean;
    /**
     * Dash pattern of the stroke.
     */
    dash?: number[];
}

/**
 * Properties to be provided with {@link Graphics.fillText}.
 */
export interface TextFill {
    /**
     * X-axis coordinate at which to begin drawing text.
     */
    x: number;
    /**
     * Y-axis coordinate at which to begin drawing text.
     */
    y: number;
    /**
     * Text baseline when drawing text.
     */
    baseline: 'top' | 'middle' | 'bottom';
    /**
     * Text alignment when drawing text.
     */
    align: 'left' | 'right' | 'center';
    /**
     * CSS font string.
     */
    font: string;
    /**
     * Text color.
     */
    color: string;
    /**
     * Text to draw.
     */
    text: string;
}

/**
 * Properties to be provided with {@link Graphics.strokeRect}.
 */
export interface RectStroke {
    /**
     * X-axis coordinate of the rectangle's starting point.
     */
    x: number;
    /**
     * Y-axis coordinate of the rectangle's starting point.
     */
    y: number;
    /**
     * The rectangle's width.
     */
    width: number;
    /**
     * The rectangle's height.
     */
    height: number;
    /**
     * Stroke color.
     */
    color: string;
    /**
     * Corner radius on the x-axis.
     */
    rx?: number;
    /**
     * Corner radius on the y-axis.
     */
    ry?: number;
    /**
     * Stroke thickness.
     */
    lineWidth?: number;
    lineJoin?: CanvasLineJoin;
    /**
     * Dash pattern of the stroke.
     */
    dash?: number[];
    crispen?: boolean;
}

/**
 * Properties to be provided with {@link Graphics.strokePath}.
 */
export interface PathStroke {
    path: Path;
    color: string;
    lineWidth?: number;
    lineCap?: CanvasLineCap;
    lineJoin?: CanvasLineJoin;
    dash?: number[];
}

/**
 * Properties to be provided with {@link Graphics.fillPath}.
 */
export interface PathFill {
    path: Path;
    fill: FillStyle;
}

export interface TextMetrics {
    width: number;
}

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
            utils.roundRect(this.ctx, fill.x, fill.y, fill.width, fill.height, fill.rx || 0, fill.ry || 0);
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
                utils.roundRect(this.ctx, box.x, box.y, box.width, box.height, stroke.rx || 0, stroke.ry || 0);
                this.ctx.stroke();
            } else {
                this.ctx.strokeRect(box.x, box.y, box.width, box.height);
            }
        } else {
            if (stroke.rx || stroke.ry) {
                utils.roundRect(this.ctx, stroke.x, stroke.y, stroke.width, stroke.height, stroke.rx || 0, stroke.ry || 0);
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

export interface PathSegment {
    x: number;
    y: number;
    line: boolean;
}

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
            if (segment.line) {
                this.ctx.lineTo(segment.x, segment.y);
            } else {
                this.ctx.moveTo(segment.x, segment.y);
            }
        }
        this.ctx.fill();
    }
}
