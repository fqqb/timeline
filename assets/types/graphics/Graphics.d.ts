import { EllipseFill } from './EllipseFill';
import { EllipseStroke } from './EllipseStroke';
import { FillStyle } from './FillStyle';
import { HitCanvas } from './HitCanvas';
import { HitRegionBuilder } from './HitRegionBuilder';
import { HitRegionSpecification } from './HitRegionSpecification';
import { PathFill } from './PathFill';
import { PathStroke } from './PathStroke';
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
export declare class Graphics {
    readonly canvas: HTMLCanvasElement;
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
    /**
     * Dots per pixel
     */
    private dppx;
    constructor(canvas: HTMLCanvasElement, hitCanvas?: HitCanvas);
    createChild(width: number, height: number): Graphics;
    copy(g: Graphics, dx: number, dy: number): void;
    clearHitCanvas(): void;
    fillCanvas(fill: FillStyle): void;
    /**
     * Returns the CSS width.
     */
    get width(): number;
    /**
     * Returns the CSS height.
     */
    get height(): number;
    resize(width: number, height: number): void;
    fillRect(fill: RectFill): void;
    fillEllipse(fill: EllipseFill): void;
    fillText(fill: TextFill): void;
    measureText(text: string, font: string): TextMetrics;
    strokeRect(stroke: RectStroke): void;
    strokeEllipse(stroke: EllipseStroke): void;
    strokePath(stroke: PathStroke): void;
    fillPath(fill: PathFill): void;
    addHitRegion(region: HitRegionSpecification): HitRegionBuilder;
}
