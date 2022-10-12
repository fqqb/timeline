import { Path } from '../graphics/Path';
export declare class HitRegionBuilder {
    private ctx;
    constructor(ctx: CanvasRenderingContext2D);
    addRect(x: number, y: number, width: number, height: number): this;
    addEllipse(cx: number, cy: number, rx: number, ry: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
    addPath(path: Path): void;
}
