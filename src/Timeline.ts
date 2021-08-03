import { AnimatableProperty } from './AnimatableProperty';
import { DefaultSidebar } from './DefaultSidebar';
import { DOMEventHandler, Tool } from './DOMEventHandler';
import { Drawable } from './Drawable';
import { EventClickEvent, HeaderClickEvent, TimelineEvent, TimelineEventHandlers, ViewportChangeEvent, ViewportMouseMoveEvent, ViewportMouseOutEvent } from './events';
import { Graphics, Path } from './Graphics';
import { Line } from './Line';
import { Sidebar } from './Sidebar';

/**
 * Resizes a canvas, but only if the new bounds are different.
 */
function resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
    if (canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
    }
}

export class Timeline {

    private _sidebar?: Sidebar;
    private _drawables: Drawable[] = [];

    private rootPanel: HTMLDivElement;
    private scrollPanel: HTMLDivElement;
    private g: Graphics;

    private _start: AnimatableProperty;
    private _stop: AnimatableProperty;
    private selection?: { start: number, stop: number; };

    frameTime?: number;

    private repaintRequested = false;
    private autoRepaintDelay = 1000;

    // Frozen header outside of the scrollpane
    private frozenGraphics: Graphics;

    private eventListeners: TimelineEventHandlers = {
        headerclick: [],
        eventclick: [],
        viewportchange: [],
        viewportmousemove: [],
        viewportmouseout: [],
    };

    private eventHandler: DOMEventHandler;
    private repaintIntervalHandle?: number;

    /**
     * If true, some actions (e.g. panBy) will animate
     * property transitions.
     */
    animated = true;
    private animatableProperties: AnimatableProperty[] = [];

    private _backgroundOddColor = 'white';
    private _backgroundEvenColor = '#f5f5f5';
    private _foregroundColor = 'grey';
    private _rowBorderColor = '#e8e8e8';
    private _rowBorderLineWidth = 1;
    private _fontFamily = 'Verdana, Geneva, sans-serif';
    private _textSize = 10;

    private _unselectedBackgroundColor = '#aaa';
    private _unselectedOpacity = 0.3;
    private _selectedBackgroundColor = 'transparent';
    private _selectedOpacity = 0.2;
    private _selectedLineDash = [4, 3];
    private _selectedLineColor = 'transparent';

    constructor(private readonly targetElement: HTMLElement) {

        // Wrapper to not modify the user element much more
        this.rootPanel = document.createElement('div');
        this.rootPanel.className = 'timeline-root';
        this.rootPanel.style.overflow = 'hidden';
        this.rootPanel.style.position = 'relative';
        this.rootPanel.style.fontSize = '0';
        targetElement.appendChild(this.rootPanel);

        this.scrollPanel = document.createElement('div');
        this.scrollPanel.className = 'timeline-scroll';
        this.scrollPanel.style.height = '100%';
        this.scrollPanel.style.overflow = 'hidden';
        this.scrollPanel.style.position = 'relative';
        this.scrollPanel.style.fontSize = '0';
        this.rootPanel.appendChild(this.scrollPanel);

        const canvas = document.createElement('canvas');
        this.scrollPanel.appendChild(canvas);
        this.g = new Graphics(canvas);

        this._start = this.createAnimatableProperty(0);
        this._stop = this.createAnimatableProperty(100);

        this.scrollPanel.addEventListener('scroll', () => {
            this.requestRepaint();
        });

        this.eventHandler = new DOMEventHandler(this, canvas, this.g.hitCanvas);

        const frozenCanvas = document.createElement('canvas');
        frozenCanvas.className = 'timeline-frozen';
        frozenCanvas.style.position = 'absolute';
        frozenCanvas.style.top = '0';
        frozenCanvas.style.left = '0';
        frozenCanvas.style.pointerEvents = 'none';
        this.rootPanel.appendChild(frozenCanvas);
        this.frozenGraphics = new Graphics(frozenCanvas);

        this.sidebar = new DefaultSidebar(this);

        window.requestAnimationFrame(t => this.step(t));

        // Periodically redraw everything (used by continuously changing elements)
        this.repaintIntervalHandle = window.setInterval(() => this.requestRepaint(), this.autoRepaintDelay);
    }

    /**
     * Free resources used by this Timeline instance (like intervals).
     */
    disconnect() {
        if (this.repaintIntervalHandle) {
            window.clearInterval(this.repaintIntervalHandle);
        }
        for (const drawable of this._drawables) {
            drawable.disconnectedCallback();
        }
        this.sidebar?.disconnectedCallback();
    }

    createAnimatableProperty(value: number) {
        const property = new AnimatableProperty(value);
        this.animatableProperties.push(property);
        return property;
    }

    private step(t: number) {
        window.requestAnimationFrame(t => this.step(t));
        this.frameTime = t;

        for (const property of this.animatableProperties) {
            if (this.animated) {
                if (property.step(t)) {
                    this.repaintRequested = true;
                }
            } else {
                property.completeTransition();
            }
        }

        // Limit CPU usage to when we need it
        if (this.repaintRequested) {
            this.g.clearHitCanvas();
            this.drawScreen();
            this.repaintRequested = false;
        }
    }

    /**
     * Sets the visible range.
     */
    setBounds(start: number, stop: number, animate = true) {
        if (this.animated && animate) {
            this._start.setTransition(this.frameTime, start);
            this._stop.setTransition(this.frameTime, stop);
        } else {
            this._start.value = start;
            this._stop.value = stop;
        }
        const vpEvent: ViewportChangeEvent = { start, stop };
        this.fireEvent('viewportchange', vpEvent);
        this.requestRepaint();
    }

    /**
     * Highlight a time range as being selected.
     *
     * @param start Left bound of the selection window.
     * @param stop Right bound of the selection window.
     */
    setSelection(start: number, stop: number) {
        if (stop > start) {
            this.selection = { start, stop };
        } else {
            this.selection = { start: stop, stop: start };
        }
        this.requestRepaint();
    }

    /**
     * Clear the current time range selection (if any)
     */
    clearSelection() {
        this.selection = undefined;
        this.requestRepaint();
    }

    /**
     * The leftmost visible start time.
     */
    get start() { return this._start.value; }

    /**
     * The rightmost visible stop time.
     */
    get stop() { return this._stop.value; }

    /**
     * The pixel width of this Timeline (incl. sidebar)
     */
    get width() {
        return this.scrollPanel.clientWidth;
    }

    /**
     * Optional sidebar. If set, this is positioned left of
     * the main area.
     */
    get sidebar() { return this._sidebar; }
    set sidebar(sidebar: Sidebar | undefined) {
        if (this._sidebar !== sidebar) {
            this._sidebar?.disconnectedCallback();
            this._sidebar = sidebar;
        }
    }

    get cursor() { return this.g.canvas.style.cursor; }
    set cursor(cursor: string) {
        if (cursor !== this.cursor) {
            this.g.canvas.style.cursor = cursor;
        }
    }

    /**
    * Returns the content of the current canvas as an image.
    */
    toDataURL(type = 'image/png', quality?: any) {
        return this.g.ctx.canvas.toDataURL(type, quality);
    }

    /**
     * Request a repaint of the canvas.
     *
     * The repaint is done async from a  UI render loop.
     *
     * In general it should not be needed to use this method. Lines and decorations
     * trigger repaints automatically.
     */
    requestRepaint() {
        this.repaintRequested = true;
    }

    /**
     * The pixel width of this Timeline (excl. sidebar)
     */
    get mainWidth() {
        let sidebarWidth = this.sidebar?.clippedWidth || 0;
        return this.width - sidebarWidth;
    }

    /**
     * Internal method to bind a drawable to this Timeline instance.
     * This method is called in the top-level constructor implementation
     * of a Drawable.
     *
     * @hidden
     */
    add<T extends Drawable>(drawable: T): T {
        if (drawable instanceof Sidebar) {
            this.sidebar = drawable;
        } else if (this._drawables.indexOf(drawable) === -1) {
            this._drawables.push(drawable);
            this.requestRepaint();
        }
        return drawable;
    }

    /**
     * Register a listener that receives an update when an Event is clicked.
     */
    addEventClickListener(listener: (ev: EventClickEvent) => void) {
        this.eventListeners.eventclick.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * event click events.
     */
    removeEventClickListener(listener: (ev: EventClickEvent) => void) {
        this.eventListeners.eventclick = this.eventListeners.eventclick
            .filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates when a line header is clicked.
     */
    addHeaderClickListener(listener: (ev: HeaderClickEvent) => void) {
        this.eventListeners.headerclick.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * header click events.
     */
    removeHeaderClickListener(listener: (ev: HeaderClickEvent) => void) {
        this.eventListeners.headerclick = this.eventListeners.headerclick
            .filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates when the viewport bounds
     * have changed.
     *
     * This generates a lot of events, especially while panning. You can
     * use this method as a signal for backend data fetches, but be sure
     * to debounce the events (for example by taking the last event after
     * ~400 ms have passed without another update).
     */
    addViewportChangeListener(listener: (ev: ViewportChangeEvent) => void) {
        this.eventListeners.viewportchange.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * viewport change events.
     */
    removeViewportChangeListener(listener: (ev: ViewportChangeEvent) => void) {
        this.eventListeners.viewportchange = this.eventListeners.viewportchange
            .filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving
     * over the viewport.
     */
    addViewportMouseMoveListener(listener: (ev: ViewportMouseMoveEvent) => void) {
        this.eventListeners.viewportmousemove.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * viewport mouse-move events.
     */
    removeViewportMouseMoveListener(listener: (ev: ViewportMouseMoveEvent) => void) {
        this.eventListeners.viewportmousemove = this.eventListeners.viewportmousemove
            .filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving
     * outside the viewport.
     */
    addViewportMouseOutListener(listener: (ev: ViewportMouseOutEvent) => void) {
        this.eventListeners.viewportmouseout.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * viewport mouse-out events.
     */
    removeViewportMouseOutListener(listener: (ev: ViewportMouseOutEvent) => void) {
        this.eventListeners.viewportmouseout = this.eventListeners.viewportmouseout
            .filter(el => (el !== listener));
    }

    /** @hidden */
    fireEvent<K extends keyof TimelineEventHandlers>(type: K, event: TimelineEvent) {
        const listeners = this.eventListeners[type];
        listeners.forEach((listener: any) => listener(event));
    }

    /**
     * Change the the visible range by a distance in pixels.
     *
     * A positive number pans towards the future, whereas a negative number
     * pans towards the past.
     */
    panBy(x: number, animate = true) {
        const totalMillis = this.stop - this.start;
        const totalPixels = this.mainWidth;
        const offsetMillis = (x / totalPixels) * totalMillis;

        const start = this.start + offsetMillis;
        const stop = this.stop + offsetMillis;
        this.setBounds(start, stop, animate);
    }

    /**
     * Pan to the specified time while keeping the current time range.
     *
     * @param time target time to reveal
     */
    panTo(time: number, animate = true) {
        const delta = (this.stop - this.start) / 2;
        const start = time - delta;
        const stop = time + delta;
        this.setBounds(start, stop, animate);
    }

    /**
     * The time corresponding with the visible center.
     */
    get center() { return this.start + (this.stop - this.start) / 2; }
    set center(time: number) {
        this.panTo(time, false);
    }

    /**
     * Returns the drawables bound to this Timeline instance.
     */
    getChildren() {
        return [...this._drawables];
    }

    /**
     * Returns all Line instances bound to this Timeline instance.
     */
    getLines() {
        return this._drawables.filter(l => l instanceof Line) as Line[];
    }

    /**
     * Remove a drawable from this Timeline instance.
     *
     * @returns Whether an element was actually removed.
     */
    removeChild(drawable: Drawable): boolean {
        if (drawable === this.sidebar) {
            drawable.disconnectedCallback();
            this.sidebar = undefined;
            this.requestRepaint();
            return true;
        } else {
            const idx = this._drawables.indexOf(drawable);
            if (idx !== -1) {
                drawable.disconnectedCallback();
                this._drawables.splice(idx, 1);
                this.requestRepaint();
                return true;
            }
            return false;
        }
    }

    /**
     * Returns the x position in points for the given time
     */
    positionTime(time: number) {
        return this.distanceBetween(this.start, time);
    }

    /**
     * Returns pixel count between two times. The sign
     * is negative if time2 comes after time1.
     */
    distanceBetween(time1: number, time2: number) {
        const millis = time2 - time1;
        const totalMillis = this.stop - this.start;
        return this.mainWidth * (millis / totalMillis);
    }

    setActiveTool(tool?: Tool) {
        this.eventHandler.tool = tool;
    }

    /**
     * Zooms in with a scale factor of 0.5. This means a range half as long
     * will be in view.
     */
    zoomIn() {
        this.zoom(0.5);
    }

    /**
     * Zooms out with a scale factor of 2. This means a range twice
     * as long will be in view.
     */
    zoomOut() {
        this.zoom(2);
    }

    /**
     * Zoom by a scale factor relative to the current range.
     * For example: 2 shows twice the current range, 0.5 shows half the current range.
     *
     * @param relto time around which to center the zoom. If unspecified, the
     *              zoom will be around the current centered time.
     */
    zoom(factor: number, animate = true, relto?: number) {
        if (factor <= 0) {
            throw new Error('Zoom factor should be a positive number');
        }
        if (relto === undefined) {
            relto = this.center;
        }
        const reltoRatio = (relto - this.start) / (this.stop - this.start);
        const prevRange = this.stop - this.start;
        const nextRange = prevRange * factor;

        const start = relto - (reltoRatio * nextRange);
        const stop = relto + ((1 - reltoRatio) * nextRange);
        this.setBounds(start, stop, animate);
    }

    get backgroundOddColor() { return this._backgroundOddColor; };
    set backgroundOddColor(backgroundOddColor: string) {
        this._backgroundOddColor = backgroundOddColor;
        this.requestRepaint();
    }

    get backgroundEvenColor() { return this._backgroundEvenColor; };
    set backgroundEvenColor(backgroundEvenColor: string) {
        this._backgroundEvenColor = backgroundEvenColor;
        this.requestRepaint();
    }

    get foregroundColor() { return this._foregroundColor; }
    set foregroundColor(foregroundColor: string) {
        this._foregroundColor = foregroundColor;
        this.requestRepaint();
    }

    get fontFamily() { return this._fontFamily; }
    set fontFamily(fontFamily: string) {
        this._fontFamily = fontFamily;
        this.requestRepaint();
    }

    get textSize() { return this._textSize; }
    set textSize(textSize: number) {
        this._textSize = textSize;
        this.requestRepaint();
    }

    get rowBorderColor() { return this._rowBorderColor; }
    set rowBorderColor(rowBorderColor: string) {
        this._rowBorderColor = rowBorderColor;
        this.requestRepaint();
    }

    get rowBorderLineWidth() { return this._rowBorderLineWidth; }
    set rowBorderLineWidth(rowBorderLineWidth: number) {
        this._rowBorderLineWidth = rowBorderLineWidth;
        this.requestRepaint();
    }

    private drawScreen() {
        for (const drawable of this._drawables) {
            drawable.beforeDraw(this.g);
        }

        const lines = this.getLines().filter(l => l.frozen)
            .concat(this.getLines().filter(l => !l.frozen));

        let y = 0;
        let contentHeight = 0;
        for (const line of lines) {
            line.coords.x = 0;
            line.coords.y = y;
            line.coords.width = this.mainWidth;
            line.coords.height = line.getPreferredHeight();

            contentHeight += line.height;
            y += line.height + this.rowBorderLineWidth;
        }

        this.rootPanel.style.height = this.targetElement.clientHeight + 'px';

        if (contentHeight > this.scrollPanel.clientHeight) {
            this.scrollPanel.style.overflowY = 'scroll';
        } else {
            this.scrollPanel.style.overflowY = 'hidden';
        }

        let width = this.scrollPanel.clientWidth;
        const height = Math.max(contentHeight, this.scrollPanel.clientHeight);
        this.g.resize(width, height);

        this.g.fillCanvas(this.backgroundOddColor);
        this.sidebar?.drawContent(this.g);

        const offscreen = this.g.createChild(this.mainWidth, height);
        const x = this.sidebar?.clippedWidth || 0;
        this.drawOffscreen(offscreen);
        this.g.copy(offscreen, x, 0);

        this.drawFrozenTop();
    }

    private drawOffscreen(g: Graphics) {
        let backgroundColor = this.backgroundOddColor;
        for (const drawable of this._drawables) {

            // Default (striped) background
            if (drawable instanceof Line) {
                g.fillRect({
                    x: drawable.x,
                    y: drawable.y,
                    width: g.canvas.width,
                    height: drawable.height,
                    color: backgroundColor,
                });
                backgroundColor = (backgroundColor === this.backgroundOddColor) ? this.backgroundEvenColor : this.backgroundOddColor;
            }

            drawable.drawUnderlay(g);

            // Bottom horizontal divider
            if (drawable instanceof Line) {
                const dividerY = drawable.y + drawable.height + 0.5;
                g.strokePath({
                    color: this.rowBorderColor,
                    lineWidth: this.rowBorderLineWidth,
                    path: new Path(0, dividerY).lineTo(g.canvas.width, dividerY),
                });
            }
        }

        for (const drawable of this._drawables) {
            drawable.drawContent(g);
        }

        for (const drawable of this._drawables) {
            drawable.drawOverlay(g);
        }

        this.drawSelection(g);
    }

    private drawSelection(g: Graphics) {
        if (!this.selection) {
            return;
        }

        const x1 = Math.round(this.positionTime(this.selection.start));
        const x2 = Math.round(this.positionTime(this.selection.stop));

        g.fillRect({
            x: 0,
            y: 0,
            width: x1,
            height: g.canvas.height,
            color: this._unselectedBackgroundColor,
            opacity: this._unselectedOpacity,
        });
        g.fillRect({
            x: x2,
            y: 0,
            width: g.canvas.width - x2,
            height: g.canvas.height,
            color: this._unselectedBackgroundColor,
            opacity: this._unselectedOpacity,
        });

        g.fillRect({
            x: x1,
            y: 0,
            width: g.canvas.width,
            height: g.canvas.height,
            color: this._selectedBackgroundColor,
            opacity: this._selectedOpacity,
        });

        g.strokePath({
            color: this._selectedLineColor,
            dash: this._selectedLineDash,
            path: new Path(x1 + 0.5, 0)
                .lineTo(x1 + 0.5, g.canvas.height)
                .moveTo(x2 - 0.5, 0)
                .lineTo(x2 - 0.5, g.canvas.height)
        });
    }

    // Draw frozen header in separate DOM canvas so that it is still possible to image dump
    // the entire main canvas.
    private drawFrozenTop() {
        const frozenCtx = this.frozenGraphics.ctx;
        const width = this.g.canvas.width;

        let height = 0;
        for (const line of this.getLines()) {
            if (line.frozen) {
                height += line.height;
            }
        }

        resizeCanvas(this.frozenGraphics.canvas, width, height);
        if (height) {
            frozenCtx.drawImage(this.g.canvas, 0, 0);
        }
    }
}
