import { Event } from './Event';
import { Line } from './Line';
import { RetargetableEventListener } from './RetargetableEventListener';
import { Timeline } from './Timeline';
import { nvl, roundRect } from './utils';

export interface AnnotatedEvent extends Event {
    clickListener?: RetargetableEventListener;
    hover: boolean;
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

    private annotatedEvents: AnnotatedEvent[] = [];

    constructor(timeline: Timeline) {
        super(timeline);
        this.addMutationListener(() => this.processData());
    }

    private processData() {
        this.annotatedEvents.length = 0;
        for (const event of (this.data || [])) {
            const annotatedEvent: AnnotatedEvent = { ...event, hover: false };

            annotatedEvent.clickListener = this.addClickListener(() => {
                console.log('event got clicked', event);
            });
            this.addHoverListener(() => {
                annotatedEvent.hover = true;
            });

            annotatedEvent.clickListener.cursor = 'pointer';
            this.annotatedEvents.push(annotatedEvent);
        }
    }

    drawLineContent(ctx: CanvasRenderingContext2D) {
        ctx.canvas.height = this.eventHeight + this.marginBottom + this.marginTop;

        for (const event of this.annotatedEvents) {
            const t1 = this.timeline.positionTime(event.start);
            const t2 = this.timeline.positionTime(event.stop);
            ctx.fillStyle = nvl(event.color, this.eventColor);

            const x = Math.round(t1);
            const y = Math.round(this.marginTop);
            const width = Math.round(t2 - x);
            const height = this._eventHeight;
            const r = nvl(event.cornerRadius, this.cornerRadius);
            roundRect(ctx, x, y, width, height, r);
            ctx.fill();

            event.clickListener!.target = { x, y, width, height };

            const borderWidth = nvl(event.borderWidth, this.borderWidth);
            if (borderWidth) {
                ctx.strokeStyle = nvl(event.borderColor, this.borderColor);
                ctx.lineWidth = borderWidth;
                roundRect(ctx, x + 0.5, y + 0.5, width - 1, height - 1, r);
                ctx.stroke();
            }

            if (event.title) {
                ctx.fillStyle = nvl(event.textColor, this.textColor);
                ctx.font = `${nvl(event.textSize, this.textSize)}px ${nvl(event.fontFamily, this.fontFamily)}`;
                ctx.textBaseline = 'middle';
                const textX = x + nvl(event.marginLeft, this.eventMarginLeft);
                ctx.fillText(event.title, textX, y + (height / 2));
            }
        }
    }

    get marginTop() { return this._marginTop; }
    set marginTop(marginTop: number) {
        this._marginTop = marginTop;
        this.reportMutation();
    }

    get marginBottom() { return this._marginBottom; }
    set marginBottom(marginBottom: number) {
        this._marginBottom = marginBottom;
        this.reportMutation();
    }

    get eventHeight() { return this._eventHeight; }
    set eventHeight(eventHeight: number) {
        this._eventHeight = eventHeight;
        this.reportMutation();
    }

    get eventColor() { return this._eventColor; }
    set eventColor(eventColor: string) {
        this._eventColor = eventColor;
        this.reportMutation();
    }

    get textColor() { return this._textColor; }
    set textColor(textColor: string) {
        this._textColor = textColor;
        this.reportMutation();
    }

    get textSize() { return this._textSize; }
    set textSize(textSize: number) {
        this._textSize = textSize;
        this.reportMutation();
    }

    get fontFamily() { return this._fontFamily; }
    set fontFamily(fontFamily: string) {
        this._fontFamily = fontFamily;
        this.reportMutation();
    }

    get borderWidth() { return this._borderWidth; }
    set borderWidth(borderWidth: number) {
        this._borderWidth = borderWidth;
        this.reportMutation();
    }

    get borderColor() { return this._borderColor; };
    set borderColor(borderColor: string) {
        this._borderColor = borderColor;
        this.reportMutation();
    }

    get eventMarginLeft() { return this._eventMarginLeft; }
    set eventMarginLeft(eventMarginLeft: number) {
        this._eventMarginLeft = eventMarginLeft;
        this.reportMutation();
    }

    get cornerRadius() { return this._cornerRadius; }
    set cornerRadius(cornerRadius: number) {
        this._cornerRadius = cornerRadius;
        this.reportMutation();
    }
}
