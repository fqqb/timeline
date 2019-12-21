import { nvl, roundRect } from './drawutils';
import { Line } from './Line';

export interface Event {
    start: number;
    stop: number;
    title?: string;
    color?: string;
    textColor?: string;
    textSize?: number;
    fontFamily?: string;
    borderColor?: string;
    borderWidth?: number;
    marginLeft?: number;
    cornerRadius?: number;
    data?: any;
}

interface ComputedEvent extends Event {
    original: Event;
}

export class EventLine extends Line<Event[]> {

    private _marginTop = 7;
    private _marginBottom = 7;
    private _eventHeight = 20;

    private _eventColor = '#77b1e1';
    private _textColor = '#333';
    private _textSize = 10;
    private _fontFamily = 'Verdana, Geneva, sans-serif';
    private _borderWidth = 1;
    private _borderColor = '#3d94c7';
    private _eventMarginLeft = 5;
    private _cornerRadius = 1;

    private events: ComputedEvent[] = [];

    onDataUpdate() {
        const events = this.data || [];
        for (const originalEvent of events) {
            const event: ComputedEvent = { ...originalEvent, original: originalEvent };
            this.events.push(event);
        }
    }

    drawLineContent(ctx: CanvasRenderingContext2D) {
        ctx.canvas.height = this._eventHeight + this._marginBottom + this._marginTop;

        const events = this.events;
        for (const event of events) {
            const t1 = this.timenav.positionTime(event.start);
            const t2 = this.timenav.positionTime(event.stop);
            ctx.fillStyle = nvl(event.color, this._eventColor);

            const x = Math.round(t1);
            const y = Math.round(this._marginTop);
            const w = Math.round(t2 - x);
            const h = this._eventHeight;
            const r = nvl(event.cornerRadius, this._cornerRadius);
            roundRect(ctx, x, y, w, h, r);
            ctx.fill();

            const borderWidth = nvl(event.borderWidth, this._borderWidth);
            if (borderWidth) {
                ctx.strokeStyle = nvl(event.borderColor, this._borderColor);
                ctx.lineWidth = borderWidth;
                roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
                ctx.stroke();
            }

            if (event.title) {
                ctx.fillStyle = nvl(event.textColor, this._textColor);
                ctx.font = `${nvl(event.textSize, this._textSize)}px ${nvl(event.fontFamily, this._fontFamily)}`;
                ctx.textBaseline = 'middle';
                const textX = x + nvl(event.marginLeft, this._eventMarginLeft);
                ctx.fillText(event.title, textX, y + (h / 2));
            }
        }
    }
}
