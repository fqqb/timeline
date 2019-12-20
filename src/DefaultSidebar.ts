import { Line } from './Line';
import { Sidebar } from './Sidebar';

export class DefaultSidebar extends Sidebar {

    private _dividerColor = '#b3b3b3';
    private _backgroundOddColor = '#eee';
    private _backgroundEvenColor = '#e7e7e7';
    private _rowBorderColor = '#d9d9d9';
    private _foregroundColor = '#333';
    private _fontFamily = 'Verdana, Geneva, sans-serif';
    private _textSize = 10;

    drawContent(ctx: CanvasRenderingContext2D) {
        const tmpCanvas = this.drawOffscreen(this.width, ctx.canvas.height);
        ctx.drawImage(tmpCanvas, 0, 0);
    }

    private drawOffscreen(width: number, height: number) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = this.backgroundOddColor;
        ctx.fillRect(0, 0, this.clippedWidth, canvas.height);

        const lines = this.timenav.getLines().filter(l => l.frozen)
            .concat(this.timenav.getLines().filter(l => !l.frozen));

        let y = 0;
        let backgroundColor = this.backgroundOddColor;
        for (const line of lines) {
            this.drawLine(ctx, line, y, backgroundColor);
            backgroundColor = (backgroundColor === this.backgroundOddColor) ? this.backgroundEvenColor : this.backgroundOddColor;
            y += line.height + this.timenav.rowBorderLineWidth;
        }

        // Right vertical divider
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.dividerColor;
        ctx.beginPath();
        ctx.moveTo(this.clippedWidth - 0.5, 0);
        ctx.lineTo(this.clippedWidth - 0.5, canvas.height);
        ctx.stroke();

        return canvas;
    }

    private drawLine(ctx: CanvasRenderingContext2D, line: Line<any>, y: number, backgroundColor: string) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, y, this.width, line.height);

        if (line.label) {
            ctx.fillStyle = this.foregroundColor;
            ctx.font = `${this.textSize}px ${this.fontFamily}`;
            ctx.textBaseline = 'middle';
            ctx.fillText(line.label, 5, y + (line.height / 2));
        }

        // Bottom horizontal divider
        ctx.lineWidth = this.timenav.rowBorderLineWidth;
        ctx.strokeStyle = this.rowBorderColor;
        const dividerY = y + line.height + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, dividerY);
        ctx.lineTo(this.clippedWidth, dividerY);
        ctx.stroke();
    }

    get backgroundOddColor() { return this._backgroundOddColor; };
    set backgroundOddColor(backgroundOddColor: string) {
        this._backgroundOddColor = backgroundOddColor;
        this.reportMutation();
    }

    get backgroundEvenColor() { return this._backgroundEvenColor; };
    set backgroundEvenColor(backgroundEvenColor: string) {
        this._backgroundEvenColor = backgroundEvenColor;
        this.reportMutation();
    }

    set backgroundColor(backgroundColor: string) {
        this._backgroundOddColor = backgroundColor;
        this._backgroundEvenColor = backgroundColor;
        this.reportMutation();
    }

    get foregroundColor() { return this._foregroundColor; }
    set foregroundColor(foregroundColor: string) {
        this._foregroundColor = foregroundColor;
        this.reportMutation();
    }

    get dividerColor() { return this._dividerColor; }
    set dividerColor(dividerColor: string) {
        this._dividerColor = dividerColor;
        this.reportMutation();
    }

    get rowBorderColor() { return this._rowBorderColor; }
    set rowBorderColor(rowBorderColor: string) {
        this._rowBorderColor = rowBorderColor;
        this.reportMutation();
    }

    get fontFamily() { return this._fontFamily; }
    set fontFamily(fontFamily: string) {
        this._fontFamily = fontFamily;
        this.reportMutation();
    }

    get textSize() { return this._textSize; }
    set textSize(textSize: number) {
        this._textSize = textSize;
        this.reportMutation();
    }
}
