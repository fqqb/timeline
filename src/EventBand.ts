import { Band } from './Band';
import { Event } from './Event';
import { TimelineEvent } from './events';
import { FillStyle, Graphics } from './Graphics';
import { HitRegionSpecification } from './HitCanvas';
import { Bounds } from './positioning';
import { drawCircle, drawDiamond, drawDot, drawReverseTriangle, drawTriangle, ShapeStyle } from './shapes';
import { Timeline } from './Timeline';

/**
 * Event generated when a Timeline Event was clicked.
 */
export interface EventClickEvent extends TimelineEvent {
    /**
     * The event that was clicked.
     */
    event: Event;
}

/**
 * Event generated in relation to mouse interactions on Timeline
 * events.
 */
export interface EventMouseEvent extends TimelineEvent {
    /**
     * Horizontal coordinate of the mouse pointer, relative to
     * the browser page.
     */
    clientX: number;

    /**
     * Vertical coordinate of the mouse pointer, relative to the
     * browser page.
     */
    clientY: number;

    /**
     * The applicable event.
     */
    event: Event;
}

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
export type MilestoneShape = 'circle' | 'diamond' | 'dot' | 'triangle' | 'reverse_triangle';

export class EventBand extends Band {

    private _eventBackground: FillStyle = '#77b1e1';
    private _eventBorderColor = '#000000';
    private _eventBorderDash: number[] = [];
    private _eventBorderWidth = 0;
    private _eventCornerRadius = 1;
    private _eventCursor = 'pointer';
    private _eventFontFamily = 'Verdana, Geneva, sans-serif';
    private _eventHeight = 20;
    private _eventHoverBackground: FillStyle = 'rgba(255, 255, 255, 0.2)';
    private _eventMarginLeft = 5;
    private _eventTextColor = '#333333';
    private _eventTextOverflow: TextOverflow = 'show';
    private _eventTextSize = 10;
    private _events: Event[] = [];
    private _lineSpacing = 2;
    private _spaceBetween = 0;
    private _multiline = true;
    private _milestoneShape: MilestoneShape = 'diamond';

    private eventsById = new Map<Event, string>();
    private annotatedEvents: AnnotatedEvent[] = [];
    private lines: AnnotatedEvent[][] = [];

    private eventClickListeners: Array<(ev: EventClickEvent) => void> = [];
    private eventMouseMoveListeners: Array<(ev: EventMouseEvent) => void> = [];
    private eventMouseOutListeners: Array<(ev: EventMouseEvent) => void> = [];

    constructor(timeline: Timeline) {
        super(timeline);
        this.marginBottom = 7;
        this.marginTop = 7;
    }

    /**
     * Register a listener that receives an update when an Event is clicked.
     */
    addEventClickListener(listener: (ev: EventClickEvent) => void) {
        this.eventClickListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * event click events.
     */
    removeEventClickListener(listener: (ev: EventClickEvent) => void) {
        this.eventClickListeners = this.eventClickListeners.filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving
     * over an event.
     */
    addEventMouseMoveListener(listener: (ev: EventMouseEvent) => void) {
        this.eventMouseMoveListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * event mouse-move events.
     */
    removeEventMouseMoveListener(listener: (ev: EventMouseEvent) => void) {
        this.eventMouseMoveListeners = this.eventMouseMoveListeners.filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving
     * outside an event.
     */
    addEventMouseOutListener(listener: (ev: EventMouseEvent) => void) {
        this.eventMouseOutListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * event mouse-out events.
     */
    removeEventMouseOutListener(listener: (ev: EventMouseEvent) => void) {
        this.eventMouseOutListeners = this.eventMouseOutListeners.filter(el => (el !== listener));
    }

    // Link a long-term identifier with each event
    // TODO should make it customizable to have custom
    // equality check, instead of only by-reference.
    private processData() {
        this.annotatedEvents.length = 0;
        for (const event of (this.events || [])) {
            let id = this.eventsById.get(event);
            if (id === undefined) {
                id = 'event_band_' + eventSequence++;
            }
            const annotatedEvent: AnnotatedEvent = {
                ...event,
                hovered: false,
                region: {
                    id,
                    cursor: this.eventCursor,
                    click: () => {
                        this.eventClickListeners.forEach(listener => listener({
                            event,
                        }));
                    },
                    mouseEnter: () => {
                        annotatedEvent.hovered = true;
                        this.reportMutation();
                    },
                    mouseMove: mouseEvent => {
                        this.eventMouseMoveListeners.forEach(listener => listener({
                            clientX: mouseEvent.clientX,
                            clientY: mouseEvent.clientY,
                            event,
                        }));
                    },
                    mouseOut: mouseEvent => {
                        annotatedEvent.hovered = false;
                        this.reportMutation();
                        this.eventMouseOutListeners.forEach(listener => listener({
                            clientX: mouseEvent.clientX,
                            clientY: mouseEvent.clientY,
                            event,
                        }));
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

    /** @hidden */
    calculateContentHeight(g: Graphics) {
        this.measureEvents(g);
        const visibleEvents = this.annotatedEvents.filter(event => !!event.drawInfo);
        this.lines = this.multiline ? this.wrapEvents(visibleEvents) : [visibleEvents];

        let newHeight;
        if (this.lines.length) {
            newHeight = this.eventHeight * this.lines.length;
            newHeight += this.lineSpacing * (this.lines.length - 1);
            return newHeight;
        } else {
            return this.eventHeight;
        }
    }

    /** @hidden */
    drawBandContent(g: Graphics) {
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const offsetY = i * (this.lineSpacing + this.eventHeight);
            for (const event of line) {
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
            startX, renderStartX, renderStopX, label, font, marginLeft
        } = event.drawInfo!;

        const bounds: Bounds = {
            x: startX,
            y,
            width: this.eventHeight,
            height: this.eventHeight,
        };

        const shapeStyle: ShapeStyle = {
            fill: event.background ?? this.eventBackground,
            borderWidth: event.borderWidth ?? this.eventBorderWidth,
            borderColor: event.borderColor ?? this.eventBorderColor,
            borderDash: event.borderDash ?? this.eventBorderDash,
        };

        this.drawMilestoneShape(g, bounds, shapeStyle);
        if (event.hovered) {
            const hoverBackground = event.hoverBackground ?? this.eventHoverBackground;
            const hoverStyle = { ...shapeStyle, fill: hoverBackground };
            this.drawMilestoneShape(g, bounds, hoverStyle);
        }

        // Hit region covers both the shape, and potential outside text
        const hitRegion = g.addHitRegion(event.region);
        hitRegion.addRect(renderStartX, y, renderStopX - renderStartX, this.eventHeight);

        if (label) {
            g.fillText({
                x: startX + bounds.width + marginLeft,
                y: y + bounds.height / 2,
                text: label,
                font,
                baseline: 'middle',
                align: 'left',
                color: event.textColor ?? this.eventTextColor,
            });
        }
    }

    private drawMilestoneShape(g: Graphics, bounds: Bounds, style: ShapeStyle) {
        switch (this.milestoneShape) {
            case 'circle':
                drawCircle(g, bounds, style);
                break;
            case 'diamond':
                drawDiamond(g, bounds, style);
                break;
            case 'dot':
                drawDot(g, bounds, style);
                break;
            case 'reverse_triangle':
                drawReverseTriangle(g, bounds, style);
                break;
            case 'triangle':
                drawTriangle(g, bounds, style);
                break;
        }
    }

    private drawEvent(g: Graphics, event: AnnotatedEvent, y: number) {
        const {
            startX, stopX, label, renderStartX, renderStopX,
            marginLeft, offscreenStart, labelFitsBox, font,
        } = event.drawInfo!;

        const box: Bounds = {
            x: Math.round(startX),
            y,
            width: Math.round(stopX - Math.round(startX)),
            height: this.eventHeight,
        };
        const r = event.cornerRadius ?? this.eventCornerRadius;
        g.fillRect({
            ...box,
            rx: r,
            ry: r,
            fill: event.background ?? this.eventBackground,
        });

        if (event.hovered) {
            g.fillRect({
                ...box,
                rx: r,
                ry: r,
                fill: event.hoverBackground ?? this.eventHoverBackground,
            });
        }

        // Hit region covers both the box, and potential outside text
        const hitRegion = g.addHitRegion(event.region);
        hitRegion.addRect(renderStartX, y, renderStopX - renderStartX, this.eventHeight);

        const borderWidth = event.borderWidth ?? this.eventBorderWidth;
        borderWidth && g.strokeRect({
            ...box,
            rx: r,
            ry: r,
            color: event.borderColor ?? this.eventBorderColor,
            lineWidth: borderWidth,
            dash: event.borderDash ?? this.eventBorderDash,
            crispen: true,
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
                    color: event.textColor ?? this.eventTextColor,
                });
            } else if (this.eventTextOverflow === 'clip') {
                const tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = box.width;
                tmpCanvas.height = box.height;
                const offscreenCtx = tmpCanvas.getContext('2d')!;
                offscreenCtx.fillStyle = event.textColor ?? this.eventTextColor;
                offscreenCtx.font = font;
                offscreenCtx.textBaseline = 'middle';
                offscreenCtx.textAlign = 'left';
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

            let label = event.label || '';
            const textSize = event.textSize ?? this.eventTextSize;
            const fontFamily = event.fontFamily ?? this.eventFontFamily;
            const font = `${textSize}px ${fontFamily}`;
            const marginLeft = event.marginLeft ?? this.eventMarginLeft;
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
                labelFitsBox = false;
                if (label && this.eventTextOverflow === 'show') {
                    const fm = g.measureText(label, font);
                    renderStopX += marginLeft + fm.width;
                } else {
                    label = '';
                }
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
     * List of events to be drawn on this band.
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
     * Height in points of events belonging to this band.
     */
    get eventHeight() { return this._eventHeight; }
    set eventHeight(eventHeight: number) {
        this._eventHeight = eventHeight;
        this.reportMutation();
    }

    /**
     * Default background color of events belonging to this
     * band.
     */
    get eventBackground() { return this._eventBackground; }
    set eventBackground(eventBackground: FillStyle) {
        this._eventBackground = eventBackground;
        this.reportMutation();
    }

    /**
     * Default text color of events belonging to this band.
     */
    get eventTextColor() { return this._eventTextColor; }
    set eventTextColor(eventTextColor: string) {
        this._eventTextColor = eventTextColor;
        this.reportMutation();
    }

    /**
     * Default text size of events belonging to this band.
     */
    get eventTextSize() { return this._eventTextSize; }
    set eventTextSize(eventTextSize: number) {
        this._eventTextSize = eventTextSize;
        this.reportMutation();
    }

    /**
     * Default font family of events belonging to this band.
     */
    get eventFontFamily() { return this._eventFontFamily; }
    set eventFontFamily(eventFontFamily: string) {
        this._eventFontFamily = eventFontFamily;
        this.reportMutation();
    }

    /**
     * Default border thickness of events belonging to this
     * band.
     */
    get eventBorderWidth() { return this._eventBorderWidth; }
    set eventBorderWidth(eventBorderWidth: number) {
        this._eventBorderWidth = eventBorderWidth;
        this.reportMutation();
    }

    /**
     * Default border color of events belonging to this band.
     */
    get eventBorderColor() { return this._eventBorderColor; }
    set eventBorderColor(eventBorderColor: string) {
        this._eventBorderColor = eventBorderColor;
        this.reportMutation();
    }

    /**
     * Default border dash of events belong to this band.
     *
     * Provide an array of values that specify alternating lengths
     * of lines and gaps.
     */
    get eventBorderDash() { return this._eventBorderDash; }
    set eventBorderDash(eventBorderDash: number[]) {
        this._eventBorderDash = eventBorderDash;
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
     * Default corner radius of events belonging to this band.
     */
    get eventCornerRadius() { return this._eventCornerRadius; }
    set eventCornerRadius(eventCornerRadius: number) {
        this._eventCornerRadius = eventCornerRadius;
        this.reportMutation();
    }

    /**
     * True if events belonging to this band should wrap over
     * multiple lines when otherwise they would overlap.
     */
    get multiline() { return this._multiline; }
    set multiline(multiline: boolean) {
        this._multiline = multiline;
        this.reportMutation();
    }

    /**
     * In case of ``multiline=true``, this allows reserving
     * some extra whitespace that has to be present, or else
     * an event is considered to overlap.
     */
    get spaceBetween() { return this._spaceBetween; }
    set spaceBetween(spaceBetween: number) {
        this._spaceBetween = spaceBetween;
        this.reportMutation();
    }

    /**
     * In case of ``multiline=true``, this specifies the
     * whitespace between lines.
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
     * Event background when hovering.
     *
     * This is drawn on top of the actual event background.
     */
    get eventHoverBackground() { return this._eventHoverBackground; }
    set eventHoverBackground(eventHoverBackground: FillStyle) {
        this._eventHoverBackground = eventHoverBackground;
        this.reportMutation();
    }

    /**
     * In case the event is a milestone (when it has no stop time),
     * this is the shape drawn for it.
     */
    get milestoneShape() { return this._milestoneShape; }
    set milestoneShape(milestoneShape: MilestoneShape) {
        this._milestoneShape = milestoneShape;
        this.reportMutation();
    }
}
