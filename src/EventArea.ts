import { Timeline } from './Timeline';

export class EventArea {

    private backgroundColor: string;

    // A canvas outside of the scrollpane
    private headerCanvas: HTMLCanvasElement;

    constructor(private timeline: Timeline, private canvas: HTMLCanvasElement, rootPanel: HTMLDivElement) {
        this.backgroundColor = timeline.backgroundColor;

        this.headerCanvas = document.createElement('canvas');
        this.headerCanvas.className = 'event-area-top';
        this.headerCanvas.style.position = 'absolute';
        this.headerCanvas.style.top = '0';
        this.headerCanvas.style.left = '0';
        this.headerCanvas.style.pointerEvents = 'none';
        this.headerCanvas.width = this.canvas.width;

        rootPanel.appendChild(this.headerCanvas);
    }

    draw() {
        const ctx = this.canvas.getContext('2d')!;
        const sidebarWidth = this.timeline.getSidebar().width;

        // Draw main content
        const bandCanvas = this.drawBands(sidebarWidth);
        ctx.drawImage(bandCanvas, sidebarWidth, 0);

        // Draw fixed header on top
        this.drawFixedBands(sidebarWidth);
    }

    private drawBands(xOffset: number) {
        const canvas = document.createElement('canvas');
        canvas.width = this.canvas.width - xOffset;
        canvas.height = this.canvas.height;

        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Note: we also render fixed bands. This enables users
        // to make a complete image dump using the Chrome-only
        // "Save Image As..." context menu.

        let y = 0;
        for (const band of this.timeline.getBands()) {
            if (band.fixed) {
                band.draw(canvas, 0, y);
                y += band.height;
            }
        }
        for (const band of this.timeline.getBands()) {
            if (!band.fixed) {
                band.draw(canvas, 0, y);
                y += band.height;
            }
        }
        for (const decoration of this.timeline.getDecorations()) {
            decoration.draw(canvas);
        }

        return canvas;
    }

    private drawFixedBands(xOffset: number) {
        const canvas = document.createElement('canvas');

        let y = 0;
        for (const band of this.timeline.getBands()) {
            if (band.fixed) {
                y += band.height;
            }
        }

        canvas.width = this.canvas.width - xOffset;
        canvas.height = y;

        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        y = 0;
        for (const band of this.timeline.getBands()) {
            if (band.fixed) {
                band.draw(canvas, 0, y);
                y += band.height;
            }
        }

        for (const decoration of this.timeline.getDecorations()) {
            decoration.draw(canvas);
        }

        this.headerCanvas.width = this.canvas.width;
        this.headerCanvas.height = canvas.height;
        this.headerCanvas.style.height = canvas.height + 'px';
        const fixedCtx = this.headerCanvas.getContext('2d')!;
        fixedCtx.clearRect(0, 0, this.headerCanvas.width, this.headerCanvas.height);
        if (canvas.height) {
            fixedCtx.drawImage(canvas, xOffset, 0);
        }
    }
}
