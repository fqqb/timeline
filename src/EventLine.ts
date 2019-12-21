import { Line } from './Line';

export interface Event {
    start: number;
    stop: number;
    title?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    borderColor?: string;
    borders?: boolean | 'vertical';
    textAlign?: string;
    data?: any;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    if (r === 0) {
        ctx.rect(x, y, w, h);
    } else {
        if (w < 2 * r) {
            r = w / 2;
        }
        if (h < 2 * r) {
            r = h / 2;
        }
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
    }
    ctx.closePath();
}

export class EventLine extends Line<Event[]> {

    private _marginTop = 7;
    private _marginBottom = 7;
    private _eventHeight = 20;
    private _textSize = 10;
    private _fontFamily = 'Verdana, Geneva, sans-serif';
    private _borderLineWidth = 1;
    private _borderLineColor = '#3d94c7';
    private _eventLeftMargin = 5;
    private _cornerRadius = 1;

    drawLineContent(ctx: CanvasRenderingContext2D) {
        ctx.canvas.height = this._eventHeight + this._marginBottom + this._marginTop;

        const events = this.data || [];
        for (const event of events) {
            const t1 = this.timenav.positionTime(event.start);
            const t2 = this.timenav.positionTime(event.stop);
            ctx.fillStyle = '#77b1e1';

            const x = Math.round(t1);
            const y = Math.round(this._marginTop);
            const w = Math.round(t2 - x);
            const h = this._eventHeight;
            roundRect(ctx, x, y, w, h, this._cornerRadius);
            ctx.fill();

            if (this._borderLineWidth) {
                ctx.strokeStyle = this._borderLineColor;
                ctx.lineWidth = this._borderLineWidth;
                roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, this._cornerRadius);
                ctx.stroke();
            }

            if (event.title) {
                ctx.fillStyle = '#333';
                ctx.font = `${this._textSize}px ${this._fontFamily}`;
                ctx.textBaseline = 'middle';
                ctx.fillText(event.title, x + this._eventLeftMargin, y + (h / 2));
            }
        }
    }
}
