import { HitRegionSpecification } from './HitRegionSpecification';

const WHITE = 'rgb(255,255,255)';
const IS_BRAVE = !!(navigator as any).brave;

/**
 * Keeps track of regions of interest (hit regions).
 *
 * Hit regions are registered during the draw loop of the main visible canvas. A sticky
 * identifier should be used to mark regions as meaning the same between different
 * draws.
 */
export class HitCanvas {
    /*
     * Implementation note: hit regions are achieved by using a separate hidden canvas of
     * same dimension as the real visible canvas. Regions are colored using a unique color
     * and regular Canvas shapes (rect, ellipse, path).
     *
     * DOM interactions can be matched to a pixel on the hit canvas, which gives us
     * the unique color, and therefore the matching hit region (if any).
     *
     * For bubbling support, we also allow hit regions to indicate a parent ID.
     */

    readonly ctx: CanvasRenderingContext2D;
    private regionsById = new Map<string, HitRegionSpecification>();
    private regionsByColor = new Map<string, HitRegionSpecification>();

    // If present, use the root instead of the local regions map.
    // This avoids color collisions.
    private root?: HitCanvas;

    constructor(private parent?: HitCanvas, width?: number, height?: number) {
        const canvas = document.createElement('canvas');
        canvas.width = width || canvas.width;
        canvas.height = height || canvas.height;
        this.ctx = canvas.getContext('2d')!;

        // Find the root
        let candidate = parent;
        while (candidate) {
            this.root = candidate;
            candidate = candidate.parent;
        }
    }

    clear() {
        this.regionsById.clear();
        this.regionsByColor.clear();
        this.ctx.fillStyle = WHITE;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    beginHitRegion(hitRegion: HitRegionSpecification) {
        (this.root || this).regionsById.set(hitRegion.id, hitRegion);

        const color = (this.root || this).generateUniqueColor(hitRegion);

        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        return color;
    }

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
    getActiveRegion<K extends keyof HitRegionSpecification>(x: number, y: number, property?: K) {
        const pixel = this.ctx.getImageData(x, y, 1, 1).data;
        const color = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
        const target = this.regionsByColor.get(color) || undefined;
        if (target && property) {
            return this.findAncestorForProperty(target, property);
        } else {
            return target;
        }
    }

    /**
     * Returns all active regions for a given coordinate.
     *
     * @param x X-axis coordinate.
     * @param y Y-axis coordinate.
     * @param property If provided, include only regions that have this property defined.
     * @returns matching regions in bottom-up order.
     */
    getActiveRegions<K extends keyof HitRegionSpecification>(x: number, y: number, property?: K) {
        let target = this.getActiveRegion(x, y, property);
        const regions: HitRegionSpecification[] = [];
        if (target) {
            regions.push(target);
            while (target?.parentId) {
                target = this.regionsById.get(target?.parentId);
                if (target) {
                    if (property === undefined || target[property] !== undefined) {
                        regions.push(target);
                    }
                }
            }
        }
        return regions;
    }

    private findAncestorForProperty(hitRegion: HitRegionSpecification, property: keyof HitRegionSpecification) {
        if (hitRegion[property] !== undefined) {
            return hitRegion;
        }

        let candidate: HitRegionSpecification | undefined = hitRegion;
        while (candidate?.parentId) {
            candidate = this.regionsById.get(candidate.parentId);
            if (candidate && (candidate[property] !== undefined)) {
                return candidate;
            }
        }
    }

    getRegionsForProperty<K extends keyof HitRegionSpecification>(property: K) {
        const result = [];
        for (const region of this.regionsById.values()) {
            if (region[property] !== undefined) {
                result.push(region);
            }
        }
        return result;
    }

    drawRegions(ctx: CanvasRenderingContext2D, dx: number, dy: number) {
        ctx.drawImage(this.ctx.canvas, dx, dy);
    }

    createChild(width: number, height: number) {
        // Dimensions are needed for redraw onto a parent HitCanvas.
        return new HitCanvas(this, width, height);
    }

    transferTo(ctx: CanvasRenderingContext2D, dx: number, dy: number, dw: number, dh: number) {
        ctx.drawImage(this.ctx.canvas, dx, dy, dw, dh);
    }

    private generateUniqueColor(hitRegion: HitRegionSpecification): string {
        while (true) {
            const r = Math.round(Math.random() * 255);
            const g = Math.round(Math.random() * 255);
            const b = Math.round(Math.random() * 255);
            const color = `rgb(${r},${g},${b})`;

            if (!this.regionsByColor.has(color) && color !== WHITE) {
                if (IS_BRAVE) { // Work around farbling-based fingerprinting defenses
                    (this.root || this).regionsByColor.set(`rgb(${r - 1},${g - 1},${b - 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r - 1},${g - 1},${b})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r - 1},${g - 1},${b + 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r - 1},${g},${b - 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r - 1},${g},${b})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r - 1},${g},${b + 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r - 1},${g + 1},${b - 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r - 1},${g + 1},${b})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r - 1},${g + 1},${b + 1})`, hitRegion);

                    (this.root || this).regionsByColor.set(`rgb(${r},${g - 1},${b - 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r},${g - 1},${b})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r},${g - 1},${b + 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r},${g},${b - 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r},${g},${b})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r},${g},${b + 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r},${g + 1},${b - 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r},${g + 1},${b})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r},${g + 1},${b + 1})`, hitRegion);

                    (this.root || this).regionsByColor.set(`rgb(${r + 1},${g - 1},${b - 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r + 1},${g - 1},${b})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r + 1},${g - 1},${b + 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r + 1},${g},${b - 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r + 1},${g},${b})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r + 1},${g},${b + 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r + 1},${g + 1},${b - 1})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r + 1},${g + 1},${b})`, hitRegion);
                    (this.root || this).regionsByColor.set(`rgb(${r + 1},${g + 1},${b + 1})`, hitRegion);
                } else {
                    (this.root || this).regionsByColor.set(color, hitRegion);
                }

                return color;
            }
        }
    }
}
