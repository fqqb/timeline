import { Band } from './Band';
import { Timeline } from './Timeline';

export class Sidebar {

    private _fontFamily: string;
    private _textSize: number;
    private _backgroundColor: string;
    private _foregroundColor: string;
    private _dividerColor: string;
    private _rowDividerColor: string;
    private _width = 200;

    // A canvas outside of the scrollpane
    private headerCanvas: HTMLCanvasElement;

    constructor(private timeline: Timeline, private canvas: HTMLCanvasElement, rootPanel: HTMLDivElement) {
        this._fontFamily = timeline.fontFamily;
        this._textSize = timeline.textSize;
        this._backgroundColor = timeline.backgroundColor;
        this._foregroundColor = timeline.foregroundColor;
        this._dividerColor = timeline.dividerColor;
        this._rowDividerColor = timeline.dividerColor;

        this.headerCanvas = document.createElement('canvas');
        this.headerCanvas.className = 'sidebar-top';
        this.headerCanvas.style.position = 'absolute';
        this.headerCanvas.style.top = '0';
        this.headerCanvas.style.left = '0';
        this.headerCanvas.style.pointerEvents = 'none';
        this.headerCanvas.width = this.canvas.width;

        rootPanel.appendChild(this.headerCanvas);
    }

    draw() {
        const ctx = this.canvas.getContext('2d')!;

        // Draw main content
        const bandCanvas = this.drawBands(this.canvas.height);
        ctx.drawImage(bandCanvas, 0, 0);

        // Draw fixed header on top
        this.drawFixedBands();
    }

    private drawBands(height: number) {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let y = 0;
        for (const band of this.timeline.getBands()) {
            if (band.fixed) {
                this.drawBand(ctx, band, y);
                y += band.height;
            }
        }
        for (const band of this.timeline.getBands()) {
            if (!band.fixed) {
                this.drawBand(ctx, band, y);
                y += band.height;
            }
        }

        // Right vertical divider
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.dividerColor;
        ctx.beginPath();
        ctx.moveTo(canvas.width - 0.5, 0);
        ctx.lineTo(canvas.width - 0.5, canvas.height);
        ctx.stroke();

        return canvas;
    }

    private drawBand(ctx: CanvasRenderingContext2D, band: Band, y: number) {
        const label = band.label;
        if (label) {
            ctx.fillStyle = this.foregroundColor;
            ctx.font = `${this.textSize}px ${this.fontFamily}`;
            ctx.textBaseline = 'middle';
            ctx.fillText(label, 5, y + (band.height / 2));
        }

        // Bottom horizontal divider
        ctx.lineWidth = 1;
        ctx.strokeStyle = this._rowDividerColor;
        const dividerY = y + band.height - 0.5;
        ctx.beginPath();
        ctx.moveTo(0, dividerY);
        ctx.lineTo(this.width, dividerY);
        ctx.stroke();
    }

    private drawFixedBands() {
        const canvas = document.createElement('canvas');

        let y = 0;
        for (const band of this.timeline.getBands()) {
            if (band.fixed) {
                y += band.height;
            }
        }

        canvas.width = this.width;
        canvas.height = y;

        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        y = 0;
        for (const band of this.timeline.getBands()) {
            if (band.fixed) {
                this.drawBand(ctx, band, y);
                y += band.height;
            }
        }

        // Right vertical divider
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.dividerColor;
        ctx.beginPath();
        ctx.moveTo(canvas.width - 0.5, 0);
        ctx.lineTo(canvas.width - 0.5, canvas.height);
        ctx.stroke();

        this.headerCanvas.width = canvas.width;
        this.headerCanvas.height = canvas.height;
        this.headerCanvas.style.height = canvas.height + 'px';
        const fixedCtx = this.headerCanvas.getContext('2d')!;
        fixedCtx.clearRect(0, 0, this.headerCanvas.width, this.headerCanvas.height);
        if (canvas.height) {
            fixedCtx.drawImage(canvas, 0, 0);
        }
    }

    get fontFamily() {
        return this._fontFamily;
    }

    set fontFamily(fontFamily: string) {
        this._fontFamily = fontFamily;
        this.timeline.repaint();
    }

    get textSize() {
        return this._textSize;
    }

    set textSize(textSize: number) {
        this._textSize = textSize;
        this.timeline.repaint();
    }

    get backgroundColor() {
        return this._backgroundColor;
    }

    set backgroundColor(backgroundColor: string) {
        this._backgroundColor = backgroundColor;
        this.timeline.repaint();
    }

    get foregroundColor() {
        return this._foregroundColor;
    }

    set foregroundColor(foregroundColor: string) {
        this._foregroundColor = foregroundColor;
        this.timeline.repaint();
    }

    get dividerColor() {
        return this._dividerColor;
    }

    set dividerColor(dividerColor: string) {
        this._dividerColor = dividerColor;
        this.timeline.repaint();
    }

    get width() {
        return this._width;
    }

    set width(width: number) {
        this._width = width;
        this.timeline.repaint();
    }
}
