import { Event } from './Event';
import { EventClickEvent } from './events';
import { Graphics } from './Graphics';
import { HitRegionSpecification } from './HitCanvas';
import { Line } from './Line';
import { Bounds } from './positioning';
import { Timeline } from './Timeline';
import { nvl } from './utils';

interface DrawInfo {
    label: string; // Actual text to be shown on event (may include extra decoration: ◀)
    startX: number; // Left of bbox (event only)
    stopX: number; // Right of bbox (event only)
    renderStartX: number; // Left of bbox containing event and maybe outside label
    renderStopX: number; // Right of bbox containing event and maybe outside label
    offscreenStart: boolean; // True if the event starts before the visible range
    marginLeft: number; // Margin specific to the event, or else inherited from its band
    labelFitsBox: boolean; // True if the label fits in the actual event box
    font: string; // Font specific to the event, or else inherited from its band
}

interface AnnotatedEvent extends Event {
    region: HitRegionSpecification;
    drawInfo?: DrawInfo;
}

let eventSequence = 1;

export type TextOverflow = 'clip' | 'show' | 'hide';

export class EventLine extends Line {

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
    private _wrap = true;
    private _textOverflow: TextOverflow = 'show';
    private _spaceBetween = 0;
    private _lineSpacing = 2;
    private _events: Event[] = [];

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
        for (const event of (this.events || [])) {
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

    /** @hidden */
    drawLineContent(g: Graphics) {
        this.analyzeEvents(g);
        const lines = this.wrap ? this.wrapEvents() : [this.annotatedEvents];

        let newHeight;
        if (lines.length) {
            newHeight = this.marginTop + this.marginBottom;
            newHeight += this.eventHeight * lines.length;
            newHeight += this.lineSpacing * (lines.length - 1);
        } else {
            newHeight = this.marginTop + this.eventHeight + this.marginBottom;
        }
        g.resize(g.canvas.width, newHeight);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const offsetY = this.marginTop + (i * (this.lineSpacing + this.eventHeight));
            for (const event of line) {
                this.drawEvent(g, event, offsetY);
            }
        }
    }

    private drawEvent(g: Graphics, event: AnnotatedEvent, y: number) {
        const drawInfo = event.drawInfo!;
        const box: Bounds = {
            x: Math.round(drawInfo.startX),
            y,
            width: Math.round(drawInfo.stopX - Math.round(drawInfo.startX)),
            height: this.eventHeight,
        };
        const r = nvl(event.cornerRadius, this.cornerRadius);
        g.fillRect({
            ...box,
            rx: r,
            ry: r,
            color: nvl(event.color, this.eventColor),
        });

        // Hit region covers both the box, and potential outside text
        const hitRegion = g.addHitRegion(event.region);
        hitRegion.addRect(drawInfo.renderStartX, y, drawInfo.renderStopX - drawInfo.renderStartX, this.eventHeight);

        const borderWidth = nvl(event.borderWidth, this.borderWidth);
        borderWidth && g.strokeRect({
            ...box,
            rx: r,
            ry: r,
            color: nvl(event.borderColor, this.borderColor),
            lineWidth: borderWidth,
            crispen: true,
        });

        if (drawInfo.label) {
            let textX = box.x + drawInfo.marginLeft;
            const textY = box.y + (box.height / 2);
            if (drawInfo.offscreenStart) {
                textX = this.timeline.positionTime(this.timeline.start);
            }
            if (drawInfo.labelFitsBox || this.textOverflow === 'show') {
                g.fillText({
                    x: textX,
                    y: textY,
                    text: drawInfo.label,
                    font: drawInfo.font,
                    baseline: 'middle',
                    align: 'left',
                    color: nvl(event.textColor, this.textColor),
                });
            } else if (this.textOverflow === 'clip') {
                const tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = box.width;
                tmpCanvas.height = box.height;
                const offscreenCtx = tmpCanvas.getContext('2d')!;
                offscreenCtx.fillStyle = nvl(event.textColor, this.textColor);
                offscreenCtx.font = drawInfo.font;
                offscreenCtx.textBaseline = 'middle';
                offscreenCtx.textAlign = 'left';
                offscreenCtx.fillText(drawInfo.label, drawInfo.marginLeft, box.height / 2);
                g.ctx.drawImage(tmpCanvas, box.x, box.y);
            }
        }
    }

    private analyzeEvents(g: Graphics) {
        for (const event of this.annotatedEvents) {
            if (event.start > this.timeline.stop || event.stop < this.timeline.start) {
                event.drawInfo = undefined; // Forget draw info from previous step
                continue;
            }
            const startX = this.timeline.positionTime(event.start);
            const stopX = this.timeline.positionTime(event.stop);
            const renderStartX = startX;
            let renderStopX = stopX;
            const offscreenStart = event.start < this.timeline.start && event.stop > this.timeline.start;

            if (event.title) {
                console.warn('DEPRECATION: Please use Event "label" property instead of "title"');
            }

            let label = event.label || event.title || '';
            if (offscreenStart) {
                label = '◀' + label;
            }

            const font = `${nvl(event.textSize, this.textSize)}px ${nvl(event.fontFamily, this.fontFamily)}`;
            const marginLeft = nvl(event.marginLeft, this.eventMarginLeft);

            const fm = g.measureText(label, font);
            let availableLabelWidth = renderStopX - renderStartX - marginLeft;
            if (offscreenStart) {
                availableLabelWidth = renderStopX - this.timeline.positionTime(this.timeline.start) - marginLeft;
            }

            const labelFitsBox = availableLabelWidth >= fm.width;
            if (!labelFitsBox) {
                if (this.textOverflow === 'show') {
                    renderStopX = renderStartX + marginLeft + fm.width;
                } else if (this.textOverflow === 'hide') {
                    label = '';
                }
            }

            event.drawInfo = {
                font,
                marginLeft,
                offscreenStart,
                startX,
                stopX,
                renderStartX,
                renderStopX,
                label,
                labelFitsBox: labelFitsBox,
            };
        }
    }

    private wrapEvents() {
        const lines: AnnotatedEvent[][] = [];
        for (const event of this.annotatedEvents) {
            const drawInfo = event.drawInfo;
            if (!drawInfo) {
                continue;
            }
            let inserted = false;
            const startX = drawInfo.renderStartX;
            const stopX = drawInfo.renderStopX;
            for (const line of lines) {
                let min = 0;
                let max = line.length - 1;
                while (min <= max) {
                    const mid = Math.floor((min + max) / 2);
                    const midStartX = line[mid].drawInfo!.renderStartX;
                    const midStopX = line[mid].drawInfo!.renderStopX;
                    if ((stopX + this.spaceBetween) <= midStartX) {
                        max = mid - 1; // Put cursor before mid
                    } else if (startX >= (midStopX + this.spaceBetween)) {
                        min = mid + 1; // Put cursor after mid
                    } else {
                        break; // Overlap
                    }
                }
                if (min > max) {
                    line.splice(min, 0, event);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                lines.push([event]); // A new line
            }
        }
        return lines;
    }

    /**
     * List of events to be drawn on this line.
     *
     * An event is allowed to fall outside of the visible
     * time range, and in fact this can be used
     * to preload data prior to an anticipated pan
     * operation.
     */
    get events() { return this._events; }
    set events(events: Event[]) {
        this._events = events;
        this.reportMutation();
    }

    /**
     * Whitespace in points between the top of this line, and
     * the top of its events.
     */
    get marginTop() { return this._marginTop; }
    set marginTop(marginTop: number) {
        this._marginTop = marginTop;
        this.reportMutation();
    }

    /**
     * Whitespace in points between the bottom of this line,
     * and the bottom of its events.
     */
    get marginBottom() { return this._marginBottom; }
    set marginBottom(marginBottom: number) {
        this._marginBottom = marginBottom;
        this.reportMutation();
    }

    /**
     * Height in points of events belonging to this line.
     */
    get eventHeight() { return this._eventHeight; }
    set eventHeight(eventHeight: number) {
        this._eventHeight = eventHeight;
        this.reportMutation();
    }

    /**
     * Default background color of events belonging to this
     * line.
     */
    get eventColor() { return this._eventColor; }
    set eventColor(eventColor: string) {
        this._eventColor = eventColor;
        this.reportMutation();
    }

    /**
     * Default text color of events belonging to this line.
     */
    get textColor() { return this._textColor; }
    set textColor(textColor: string) {
        this._textColor = textColor;
        this.reportMutation();
    }

    /**
     * Default text size of events belonging to this line.
     */
    get textSize() { return this._textSize; }
    set textSize(textSize: number) {
        this._textSize = textSize;
        this.reportMutation();
    }

    /**
     * Default font family of events belonging to this line.
     */
    get fontFamily() { return this._fontFamily; }
    set fontFamily(fontFamily: string) {
        this._fontFamily = fontFamily;
        this.reportMutation();
    }

    /**
     * Default border thickness of events belonging to this
     * line.
     */
    get borderWidth() { return this._borderWidth; }
    set borderWidth(borderWidth: number) {
        this._borderWidth = borderWidth;
        this.reportMutation();
    }

    /**
     * Default border color of events belonging to this line.
     */
    get borderColor() { return this._borderColor; };
    set borderColor(borderColor: string) {
        this._borderColor = borderColor;
        this.reportMutation();
    }

    /**
     * Whitespace between the left border of an event, and
     * its label.
     */
    get eventMarginLeft() { return this._eventMarginLeft; }
    set eventMarginLeft(eventMarginLeft: number) {
        this._eventMarginLeft = eventMarginLeft;
        this.reportMutation();
    }

    /**
     * Default corner radius of events belonging to this line.
     */
    get cornerRadius() { return this._cornerRadius; }
    set cornerRadius(cornerRadius: number) {
        this._cornerRadius = cornerRadius;
        this.reportMutation();
    }

    /**
     * True if events belonging to this line should wrap over
     * multiple sub-lines when otherwise they would overlap.
     */
    get wrap() { return this._wrap; }
    set wrap(wrap: boolean) {
        this._wrap = wrap;
        this.reportMutation();
    }

    /**
     * In case of ``wrap=true``, this allows reserving
     * some extra whitespace that has to be present, or else
     * an event is considered to overlap.
     */
    get spaceBetween() { return this._spaceBetween; }
    set spaceBetween(spaceBetween: number) {
        this._spaceBetween = spaceBetween;
        this.reportMutation();
    }

    /**
     * In case of ``wrap=true``, this specifies the
     * whitespace between sub-lines.
     */
    get lineSpacing() { return this._lineSpacing; }
    set lineSpacing(lineSpacing: number) {
        this._lineSpacing = lineSpacing;
        this.reportMutation();
    }

    /**
     * Indicates what must happen with an event label in case
     * its width would exceed that of the event box.
     */
    get textOverflow() { return this._textOverflow; }
    set textOverflow(textOverflow: TextOverflow) {
        this._textOverflow = textOverflow;
        this.reportMutation();
    }
}
