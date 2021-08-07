import { Event } from './Event';
import { Graphics, Path } from './Graphics';
import { HitRegionSpecification } from './HitCanvas';
import { Line } from './Line';
import { Bounds } from './positioning';
import { Timeline } from './Timeline';
import { nvl } from './utils';

interface DrawInfo {
    label: string; // Actual text to be shown on event (may include extra decoration: ◀)
    startX: number; // Left of bbox (event only, not label)
    stopX: number; // Right of bbox (event only, not label)
    renderStartX: number; // Left of bbox containing event and maybe outside label
    renderStopX: number; // Right of bbox containing event and maybe outside label
    offscreenStart: boolean; // True if the event starts before the visible range
    marginLeft: number; // Margin specific to the event, or else inherited from its band
    labelFitsBox: boolean; // True if the label fits in the actual event box
    font: string; // Font specific to the event, or else inherited from its band
    milestone: boolean; // True if this event must be rendered as a milestone
}

interface AnnotatedEvent extends Event {
    region: HitRegionSpecification;
    hovered: boolean;
    drawInfo?: DrawInfo;
}

let eventSequence = 1;

export type TextOverflow = 'clip' | 'show' | 'hide';

export class EventLine extends Line {

    private _eventBorderColor = '#3d94c7';
    private _eventBorderWidth = 1;
    private _eventColor = '#77b1e1';
    private _eventCornerRadius = 1;
    private _eventCursor = 'pointer';
    private _eventFontFamily = 'Verdana, Geneva, sans-serif';
    private _eventHeight = 20;
    private _eventHoverOpacity = 0.7;
    private _eventMarginLeft = 5;
    private _eventTextColor = '#333';
    private _eventTextOverflow: TextOverflow = 'show';
    private _eventTextSize = 10;
    private _events: Event[] = [];
    private _lineSpacing = 2;
    private _spaceBetween = 0;
    private _wrap = true;

    private eventsById = new Map<Event, string>();
    private annotatedEvents: AnnotatedEvent[] = [];
    private sublines: AnnotatedEvent[][] = [];

    constructor(timeline: Timeline) {
        super(timeline);
        this.marginBottom = 7;
        this.marginTop = 7;
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
                hovered: false,
                region: {
                    id,
                    cursor: this.eventCursor,
                    click: () => {
                        this.timeline.fireEvent('eventclick', { event });
                    },
                    mouseEnter: () => {
                        annotatedEvent.hovered = true;
                        this.reportMutation();
                    },
                    mouseMove: mouseEvent => {
                        this.timeline.fireEvent('eventmousemove', {
                            clientX: mouseEvent.clientX,
                            clientY: mouseEvent.clientY,
                            event,
                        });
                    },
                    mouseOut: mouseEvent => {
                        annotatedEvent.hovered = false;
                        this.reportMutation();
                        this.timeline.fireEvent('eventmouseout', {
                            clientX: mouseEvent.clientX,
                            clientY: mouseEvent.clientY,
                            event,
                        });
                    }
                },
            };

            this.annotatedEvents.push(annotatedEvent);
        }

        this.eventsById.clear();
        for (const event of this.annotatedEvents) {
            this.eventsById.set(event, event.region.id);
        }
    }

    calculateContentHeight(g: Graphics) {
        this.measureEvents(g);
        const visibleEvents = this.annotatedEvents.filter(event => !!event.drawInfo);
        this.sublines = this.wrap ? this.wrapEvents(visibleEvents) : [visibleEvents];

        let newHeight;
        if (this.sublines.length) {
            newHeight = this.eventHeight * this.sublines.length;
            newHeight += this.lineSpacing * (this.sublines.length - 1);
            return newHeight;
        } else {
            return this.eventHeight;
        }
    }

    /** @hidden */
    drawLineContent(g: Graphics) {
        for (let i = 0; i < this.sublines.length; i++) {
            const subline = this.sublines[i];
            const offsetY = i * (this.lineSpacing + this.eventHeight);
            for (const event of subline) {
                if (event.drawInfo!.milestone) {
                    this.drawMilestone(g, event, offsetY);
                } else {
                    this.drawEvent(g, event, offsetY);
                }
            }
        }
    }

    private drawMilestone(g: Graphics, event: AnnotatedEvent, y: number) {
        const {
            startX, stopX, renderStartX, renderStopX, label, font, marginLeft
        } = event.drawInfo!;
        const r = this.eventHeight / 2;
        const path = new Path(startX + r, y)
            .lineTo(stopX, y + r)
            .lineTo(startX + r, y + r + r)
            .lineTo(startX, y + r);
        const eventColor = nvl(event.color, this.eventColor);
        const opacity = event.hovered ? this.eventHoverOpacity : 1;

        g.fillPath({ color: eventColor, path, opacity });

        // Hit region covers both the shape, and potential outside text
        const hitRegion = g.addHitRegion(event.region);
        hitRegion.addRect(renderStartX, y, renderStopX - renderStartX, this.eventHeight);

        const borderWidth = nvl(event.borderWidth, this.eventBorderWidth);
        borderWidth && g.strokePath({
            path,
            color: nvl(event.borderColor, this.eventBorderColor),
            lineWidth: borderWidth,
            opacity,
        });

        if (label) {
            g.fillText({
                x: stopX + marginLeft,
                y: y + r,
                text: label,
                font,
                baseline: 'middle',
                align: 'left',
                color: nvl(event.textColor, this.eventTextColor),
                opacity,
            });
        }
    }

    private drawEvent(g: Graphics, event: AnnotatedEvent, y: number) {
        const {
            startX, stopX, label, renderStartX, renderStopX,
            marginLeft, offscreenStart, labelFitsBox, font,
        } = event.drawInfo!;
        const opacity = event.hovered ? this.eventHoverOpacity : 1;
        const box: Bounds = {
            x: Math.round(startX),
            y,
            width: Math.round(stopX - Math.round(startX)),
            height: this.eventHeight,
        };
        const r = nvl(event.cornerRadius, this.eventCornerRadius);
        g.fillRect({
            ...box,
            rx: r,
            ry: r,
            color: nvl(event.color, this.eventColor),
            opacity,
        });

        // Hit region covers both the box, and potential outside text
        const hitRegion = g.addHitRegion(event.region);
        hitRegion.addRect(renderStartX, y, renderStopX - renderStartX, this.eventHeight);

        const borderWidth = nvl(event.borderWidth, this.eventBorderWidth);
        borderWidth && g.strokeRect({
            ...box,
            rx: r,
            ry: r,
            color: nvl(event.borderColor, this.eventBorderColor),
            lineWidth: borderWidth,
            crispen: true,
            opacity,
        });

        if (label) {
            let textX = box.x + marginLeft;
            const textY = box.y + (box.height / 2);
            if (offscreenStart) {
                textX = this.timeline.positionTime(this.timeline.start);
            }
            if (labelFitsBox || this.eventTextOverflow === 'show') {
                g.fillText({
                    x: textX,
                    y: textY,
                    text: label,
                    font,
                    baseline: 'middle',
                    align: 'left',
                    color: nvl(event.textColor, this.eventTextColor),
                    opacity,
                });
            } else if (this.eventTextOverflow === 'clip') {
                const tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = box.width;
                tmpCanvas.height = box.height;
                const offscreenCtx = tmpCanvas.getContext('2d')!;
                offscreenCtx.fillStyle = nvl(event.textColor, this.eventTextColor);
                offscreenCtx.font = font;
                offscreenCtx.textBaseline = 'middle';
                offscreenCtx.textAlign = 'left';
                if (event.hovered) {
                    offscreenCtx.globalAlpha = this.eventHoverOpacity;
                }
                offscreenCtx.fillText(label, marginLeft, box.height / 2);
                g.ctx.drawImage(tmpCanvas, box.x, box.y);
            }
        }
    }

    private measureEvents(g: Graphics) {
        for (const event of this.annotatedEvents) {
            const milestone = !event.stop;
            const start = event.start;
            const stop = event.stop || event.start;
            if (start > this.timeline.stop || stop < this.timeline.start) {
                event.drawInfo = undefined; // Forget draw info from previous step
                continue;
            }

            if (event.title) {
                console.warn('DEPRECATION: Please use Event "label" property instead of "title"');
            }

            let label = event.label || event.title || '';
            const textSize = nvl(event.textSize, this.eventTextSize);
            const fontFamily = nvl(event.fontFamily, this.eventFontFamily);
            const font = `${textSize}px ${fontFamily}`;
            const marginLeft = nvl(event.marginLeft, this.eventMarginLeft);
            const offscreenStart = start < this.timeline.start && stop > this.timeline.start;
            let labelFitsBox;

            let startX = this.timeline.positionTime(start);
            let stopX = this.timeline.positionTime(stop);

            let renderStartX;
            let renderStopX;

            if (milestone) {
                const shapeRadius = this.eventHeight / 2;
                startX -= shapeRadius;
                stopX += shapeRadius;

                renderStartX = startX;
                renderStopX = stopX;
                if (label) {
                    const fm = g.measureText(label, font);
                    renderStopX += marginLeft + fm.width;
                }
                labelFitsBox = false;
            } else {
                if (offscreenStart) {
                    label = '◀' + label;
                }
                const fm = g.measureText(label, font);

                if (offscreenStart) {
                    renderStartX = this.timeline.positionTime(this.timeline.start);
                    renderStopX = Math.max(renderStartX + fm.width, stopX);
                    labelFitsBox = false;
                } else {
                    renderStartX = startX;
                    renderStopX = stopX;
                    const availableLabelWidth = renderStopX - renderStartX - marginLeft;
                    labelFitsBox = availableLabelWidth >= fm.width;
                    if (!labelFitsBox) {
                        if (this.eventTextOverflow === 'show') {
                            renderStopX = renderStartX + marginLeft + fm.width;
                        } else if (this.eventTextOverflow === 'hide') {
                            label = '';
                        }
                    }
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
                labelFitsBox,
                milestone,
            };
        }
    }

    private wrapEvents(events: AnnotatedEvent[]) {
        const lines: AnnotatedEvent[][] = [];
        for (const event of events) {
            const { renderStartX, renderStopX } = event.drawInfo!;
            let inserted = false;
            for (const line of lines) {
                let min = 0;
                let max = line.length - 1;
                while (min <= max) {
                    const mid = Math.floor((min + max) / 2);
                    const midStartX = line[mid].drawInfo!.renderStartX;
                    const midStopX = line[mid].drawInfo!.renderStopX;
                    if ((renderStopX + this.spaceBetween) <= midStartX) {
                        max = mid - 1; // Put cursor before mid
                    } else if (renderStartX >= (midStopX + this.spaceBetween)) {
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
        this.processData();
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
    get eventTextColor() { return this._eventTextColor; }
    set eventTextColor(eventTextColor: string) {
        this._eventTextColor = eventTextColor;
        this.reportMutation();
    }

    /**
     * Default text size of events belonging to this line.
     */
    get eventTextSize() { return this._eventTextSize; }
    set eventTextSize(eventTextSize: number) {
        this._eventTextSize = eventTextSize;
        this.reportMutation();
    }

    /**
     * Default font family of events belonging to this line.
     */
    get eventFontFamily() { return this._eventFontFamily; }
    set eventFontFamily(eventFontFamily: string) {
        this._eventFontFamily = eventFontFamily;
        this.reportMutation();
    }

    /**
     * Default border thickness of events belonging to this
     * line.
     */
    get eventBorderWidth() { return this._eventBorderWidth; }
    set eventBorderWidth(eventBorderWidth: number) {
        this._eventBorderWidth = eventBorderWidth;
        this.reportMutation();
    }

    /**
     * Default border color of events belonging to this line.
     */
    get eventBorderColor() { return this._eventBorderColor; }
    set eventBorderColor(eventBorderColor: string) {
        this._eventBorderColor = eventBorderColor;
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
    get eventCornerRadius() { return this._eventCornerRadius; }
    set eventCornerRadius(eventCornerRadius: number) {
        this._eventCornerRadius = eventCornerRadius;
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
    get eventTextOverflow() { return this._eventTextOverflow; }
    set eventTextOverflow(eventTextOverflow: TextOverflow) {
        this._eventTextOverflow = eventTextOverflow;
        this.reportMutation();
    }

    /**
     * Cursor when mouse hovers an event.
     */
    get eventCursor() { return this._eventCursor; }
    set eventCursor(eventCursor: string) {
        this._eventCursor = eventCursor;
        this.reportMutation();
    }

    /**
     * Event opacity when hovering
     */
    get eventHoverOpacity() { return this._eventHoverOpacity; }
    set eventHoverOpacity(eventHoverOpacity: number) {
        this._eventHoverOpacity = eventHoverOpacity;
        this.reportMutation();
    }
}
