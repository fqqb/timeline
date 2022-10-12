import { HitRegionSpecification } from './HitRegionSpecification';
/**
 * Keeps track of regions of interest (hit regions).
 *
 * Hit regions are registered during the draw loop of the main visible canvas. A sticky
 * identifier should be used to mark regions as meaning the same between different
 * draws.
 */
export declare class HitCanvas {
    private parent?;
    readonly ctx: CanvasRenderingContext2D;
    private regionsById;
    private regionsByColor;
    private root?;
    constructor(parent?: HitCanvas | undefined, width?: number, height?: number);
    clear(): void;
    beginHitRegion(hitRegion: HitRegionSpecification): string;
    /**
     * Returns the active region for a given coordinate. Regions are tried
     * in bottom-up order.
     *
     *
     * @param x X-axis coordinate.
     * @param y Y-axis coordinate.
     * @param property If provided, require the region to have this property defined.
     * @returns matching regions in bottom-up order.
     */
    getActiveRegion<K extends keyof HitRegionSpecification>(x: number, y: number, property?: K): HitRegionSpecification | undefined;
    /**
     * Returns all active regions for a given coordinate.
     *
     * @param x X-axis coordinate.
     * @param y Y-axis coordinate.
     * @param property If provided, include only regions that have this property defined.
     * @returns matching regions in bottom-up order.
     */
    getActiveRegions<K extends keyof HitRegionSpecification>(x: number, y: number, property?: K): HitRegionSpecification[];
    private findAncestorForProperty;
    getRegionsForProperty<K extends keyof HitRegionSpecification>(property: K): HitRegionSpecification[];
    drawRegions(ctx: CanvasRenderingContext2D, dx: number, dy: number): void;
    createChild(width: number, height: number): HitCanvas;
    transferTo(ctx: CanvasRenderingContext2D, dx: number, dy: number, dw: number, dh: number): void;
    private generateUniqueColor;
}
