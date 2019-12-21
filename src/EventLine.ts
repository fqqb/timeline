import { DOMTarget } from './DOMTarget';
import { Event } from './Event';
import { Line } from './Line';
import { nvl, roundRect } from './utils';

class ComputedEvent {

    start: number;
    stop: number;
    title?: string;
    color: string;
    textColor: string;
    textSize: number;
    fontFamily: string;
    borderColor: string;
    borderWidth: number;
    marginLeft: number;
    cornerRadius: number;

    target: DOMTarget;

    constructor(line: EventLine, readonly event: Event) {
        this.start = event.start;
        this.stop = event.stop;
        this.title = event.title;
        this.color = nvl(event.color, line.eventColor);
        this.textColor = nvl(event.textColor, line.textColor);
        this.textSize = nvl(event.textSize, line.textSize);
        this.fontFamily = nvl(event.fontFamily, line.fontFamily);
        this.borderColor = nvl(event.borderColor, line.borderColor);
        this.borderWidth = nvl(event.borderWidth, line.borderWidth);
        this.marginLeft = nvl(event.marginLeft, line.eventMarginLeft);
        this.cornerRadius = nvl(event.cornerRadius, line.cornerRadius);

        this.target = new DOMTarget();
        this.target.onclick = () => { console.log('got click', event); };
        this.target.onmousemove = () => { console.log('got mousemove', event); };
        this.target.onmouseout = () => { console.log('got mouseout', event); };
    }
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
        this.events.length = 0;
        for (const event of (this.data || [])) {
            this.events.push(new ComputedEvent(this, event));
        }
    }

    drawLineContent(ctx: CanvasRenderingContext2D) {
        ctx.canvas.height = this._eventHeight + this._marginBottom + this._marginTop;

        for (const event of this.events) {
            const t1 = this.timenav.positionTime(event.start);
            const t2 = this.timenav.positionTime(event.stop);
            ctx.fillStyle = event.color;

            const x = Math.round(t1);
            const y = Math.round(this._marginTop);
            const width = Math.round(t2 - x);
            const height = this._eventHeight;
            const r = event.cornerRadius;
            roundRect(ctx, x, y, width, height, r);
            ctx.fill();

            event.target.bbox = { x, y, width, height };

            const borderWidth = event.borderWidth;
            if (borderWidth) {
                ctx.strokeStyle = event.borderColor;
                ctx.lineWidth = borderWidth;
                roundRect(ctx, x + 0.5, y + 0.5, width - 1, height - 1, r);
                ctx.stroke();
            }

            if (event.title) {
                ctx.fillStyle = event.textColor;
                ctx.font = `${event.textSize}px ${event.fontFamily}`;
                ctx.textBaseline = 'middle';
                const textX = x + event.marginLeft;
                ctx.fillText(event.title, textX, y + (height / 2));
            }
        }
    }

    get eventColor() { return this._eventColor; }
    get textColor() { return this._textColor; }
    get textSize() { return this._textSize; }
    get fontFamily() { return this._fontFamily; }
    get borderWidth() { return this._borderWidth; }
    get borderColor() { return this._borderColor; };
    get eventMarginLeft() { return this._eventMarginLeft; }
    get cornerRadius() { return this._cornerRadius; }
}
