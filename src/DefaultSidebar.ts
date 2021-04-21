import { Line } from './Line';
import { Sidebar } from './Sidebar';

export class DefaultSidebar extends Sidebar {

    private _dividerColor = '#b3b3b3';
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

        ctx.fillStyle = this.timeline.backgroundOddColor;
        ctx.fillRect(0, 0, this.clippedWidth, canvas.height);

        const lines = this.timeline.getLines().filter(l => l.frozen)
            .concat(this.timeline.getLines().filter(l => !l.frozen));

        let backgroundColor = this.timeline.backgroundOddColor;
        for (const line of lines) {
            this.drawLine(ctx, line, backgroundColor);
            backgroundColor = (backgroundColor === this.timeline.backgroundOddColor) ? this.timeline.backgroundEvenColor : this.timeline.backgroundOddColor;
        }

        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#aaa';
        ctx.fillRect(0, 0, this.clippedWidth, canvas.height);
        ctx.globalAlpha = 1;

        for (const line of lines) {
            if (line.label) {
                ctx.fillStyle = this.foregroundColor;
                ctx.font = `${this.textSize}px ${this.fontFamily}`;
                ctx.textBaseline = 'middle';
                ctx.fillText(line.label, 5, line.y + (line.height / 2));
            }
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

    private drawLine(ctx: CanvasRenderingContext2D, line: Line<any>, backgroundColor: string) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, line.y, this.width, line.height);

        // Bottom horizontal divider
        ctx.lineWidth = this.timeline.rowBorderLineWidth;
        ctx.strokeStyle = this.timeline.rowBorderColor;
        const dividerY = line.y + line.height + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, dividerY);
        ctx.lineTo(this.clippedWidth, dividerY);
        ctx.stroke();
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
