import { TimelineMouseEvent } from './DOMEventHandler';

const WHITE = 'rgb(255,255,255)';

export interface HitRegionSpecification {
    id: string;
    click?: () => void;
    mouseEnter?: () => void;
    mouseMove?: (mouseEvent: TimelineMouseEvent) => void;
    mouseOut?: (mouseEvent: TimelineMouseEvent) => void;
    mouseDown?: () => void;
    mouseUp?: () => void;
    cursor?: string;
}

export class HitCanvas {

    readonly ctx: CanvasRenderingContext2D;
    private regions: { [key: string]: HitRegionSpecification; } = {};

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
        this.regions = {};
        this.ctx.fillStyle = WHITE;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    beginHitRegion(hitRegion: HitRegionSpecification) {
        const color = (this.root || this).generateUniqueColor();
        (this.root || this).regions[color] = hitRegion;

        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        return color;
    }

    getActiveRegion(x: number, y: number): HitRegionSpecification | undefined {
        const pixel = this.ctx.getImageData(x, y, 1, 1).data;
        const color = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
        return this.regions[color] || undefined;
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

    private generateUniqueColor(): string {
        while (true) {
            const r = Math.round(Math.random() * 255);
            const g = Math.round(Math.random() * 255);
            const b = Math.round(Math.random() * 255);
            const color = `rgb(${r},${g},${b})`;

            if (!this.regions[color] && color !== WHITE) {
                return color;
            }
        }
    }
}
