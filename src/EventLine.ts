import { Event } from './Event';
import { EventClickEvent } from './events';
import { Graphics } from './Graphics';
import { HitRegionSpecification } from './HitCanvas';
import { Line } from './Line';
import { Bounds } from './positioning';
import { Timeline } from './Timeline';
import { nvl } from './utils';

interface AnnotatedEvent extends Event {
    region: HitRegionSpecification;
}

let eventSequence = 1;

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

    private eventsById = new Map<Event, string>();
    private annotatedEvents: AnnotatedEvent[] = [];

    constructor(timeline: Timeline) {
        super(timeline);
        this.addMutationListener(() => this.processData());
    }

    // Link a long-term identifier with each event
    // TODO should make it customizable to have custom
    // equality check, instead of only by-reference.
    private processData() {
        this.annotatedEvents.length = 0;
        for (const event of (this.data || [])) {
            let id = this.eventsById.get(event);
            if (id === undefined) {
                id = 'id' + eventSequence++;
            }
            const annotatedEvent: AnnotatedEvent = {
                ...event,
                region: {
                    id,
                    cursor: 'pointer',
                    click: () => {
                        const clickEvent: EventClickEvent = { event };
                        this.timeline.fireEvent('eventclick', clickEvent);
                    },
                },
            };

            this.annotatedEvents.push(annotatedEvent);
        }

        this.eventsById.clear();
        for (const event of this.annotatedEvents) {
            this.eventsById.set(event, event.region.id);
        }
    }

    drawLineContent(g: Graphics) {
        const newHeight = this.eventHeight + this.marginBottom + this.marginTop;
        g.resize(g.canvas.width, newHeight);

        for (const event of this.annotatedEvents) {
            const t1 = this.timeline.positionTime(event.start);
            const t2 = this.timeline.positionTime(event.stop);
            const box: Bounds = {
                x: Math.round(t1),
                y: Math.round(this.marginTop),
                width: Math.round(t2 - Math.round(t1)),
                height: this._eventHeight,
            };
            const r = nvl(event.cornerRadius, this.cornerRadius);
            g.fillRect({
                ...box,
                rx: r,
                ry: r,
                color: nvl(event.color, this.eventColor),
            });

            const hitRegion = g.addHitRegion(event.region);
            hitRegion.addRect(box.x, box.y, box.width, box.height);

            const borderWidth = nvl(event.borderWidth, this.borderWidth);
            borderWidth && g.strokeRect({
                ...box,
                rx: r,
                ry: r,
                color: nvl(event.borderColor, this.borderColor),
                lineWidth: borderWidth,
                crispen: true,
            });

            event.title && g.fillText({
                x: box.x + nvl(event.marginLeft, this.eventMarginLeft),
                y: box.y + (box.height / 2),
                text: event.title,
                font: `${nvl(event.textSize, this.textSize)}px ${nvl(event.fontFamily, this.fontFamily)}`,
                baseline: 'middle',
                align: 'left',
                color: nvl(event.textColor, this.textColor),
            });
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
