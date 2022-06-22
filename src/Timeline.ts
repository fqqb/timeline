import { AnimatableProperty } from './AnimatableProperty';
import { Band } from './Band';
import { DefaultSidebar } from './DefaultSidebar';
import { DOMEventHandler } from './DOMEventHandler';
import { Drawable } from './Drawable';
import { TimelineEvent, TimelineEventHandlers, ViewportChangeEvent, ViewportMouseMoveEvent, ViewportMouseOutEvent, ViewportSelectionEvent } from './events';
import { FillStyle, Graphics, Path } from './Graphics';
import { Sidebar } from './Sidebar';
import { TimeRange } from './TimeRange';

/**
 * Resizes a canvas, but only if the new bounds are different.
 */
function resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
    if (canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
    }
}

export type Tool = 'hand' | 'range-select';

export class Timeline {

    private _sidebar?: Sidebar;
    private _drawables: Drawable[] = [];

    private rootPanel: HTMLDivElement;
    private scrollPanel: HTMLDivElement;
    private g: Graphics;

    private _start: AnimatableProperty;
    private _stop: AnimatableProperty;
    private _min?: number;
    private _max?: number;
    private _minRange?: number;
    private _maxRange?: number;
    private selection?: TimeRange;

    /** @hidden */
    frameTime?: number;

    private repaintRequested = false;
    private autoRepaintDelay = 1000;

    // Frozen header outside of the scrollpane
    private frozenGraphics: Graphics;

    private eventListeners: TimelineEventHandlers = {
        viewportchange: [],
        viewportmousemove: [],
        viewportmouseout: [],
        viewportselection: [],
    };

    private eventHandler: DOMEventHandler;
    private repaintIntervalHandle?: number;

    /**
     * If true, some actions (e.g. panBy) animate property transitions.
     */
    animated = true;
    private animatableProperties: AnimatableProperty[] = [];

    private _background: FillStyle = '#ffffff';
    private _foregroundColor = 'grey';
    private _bandBorderColor = '#e8e8e8';
    private _bandBorderWidth = 1;
    private _fontFamily = 'Verdana, Geneva, sans-serif';
    private _textSize = 10;

    private _unselectedBackground: FillStyle = 'rgba(170, 170, 170, 0.3)';
    private _selectedBackground: FillStyle = 'transparent';
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

    /** @hidden */
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
            try {
                this.g.clearHitCanvas();
                this.drawScreen();
            } finally {
                this.repaintRequested = false;
            }
        }
    }

    /**
     * Sets the visible range.
     */
    setViewRange(start: number, stop: number, animate = true) {
        const { min, max, minRange, maxRange } = this;
        let millisBetween = stop - start;

        if (minRange !== undefined) {
            if (millisBetween < minRange) {
                const delta = minRange - millisBetween;
                millisBetween -= delta;
                start -= Math.floor(delta / 2);
                stop += Math.ceil(delta / 2);
            }
        }
        if (maxRange !== undefined) {
            if (millisBetween > maxRange) {
                const delta = millisBetween - maxRange;
                millisBetween += delta;
                start += Math.floor(delta / 2);
                stop -= Math.ceil(delta / 2);
            }
        }
        if (min !== undefined) {
            start = Math.max(min, start);
            if (max !== undefined) {
                millisBetween = Math.min(max - min, millisBetween);
            }
            stop = start + millisBetween;
        }
        if (max !== undefined) {
            stop = Math.min(max, stop);
            if (min !== undefined) {
                millisBetween = Math.min(max - min, millisBetween);
            }
            start = stop - millisBetween;
        }
        if (this.animated && animate) {
            this._start.setTransition(this.frameTime, start);
            this._stop.setTransition(this.frameTime, stop);
        } else {
            this._start.value = start;
            this._stop.value = stop;
        }
        this.fireEvent('viewportchange', { start, stop });
        this.requestRepaint();
    }

    /**
     * Returns the currently active selection (if any).
     */
    getSelection() {
        return this.selection;
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
        } else if (stop === start) {
            this.selection = undefined;
        } else {
            this.selection = { start: stop, stop: start };
        }
        this.fireEvent('viewportselection', { selection: this.selection });
        this.requestRepaint();
    }

    /**
     * Clear the current time range selection (if any)
     */
    clearSelection() {
        this.selection = undefined;
        this.fireEvent('viewportselection', { selection: this.selection });
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
     * The minimum possible visible time.
     */
    get min() { return this._min; }
    set min(min: number | undefined) {
        this._min = min ?? undefined;
        // Enforce new min
        this.setViewRange(this.start, this.stop, false);
    }

    /**
     * The maximum possible visible time.
     */
    get max() { return this._max; }
    set max(max: number | undefined) {
        this._max = max ?? undefined;
        // Enforce new max
        this.setViewRange(this.start, this.stop, false);
    }

    /**
     * The minimum possible visible time range.
     */
    get minRange() { return this._minRange; }
    set minRange(minRange: number | undefined) {
        this._minRange = minRange ?? undefined;
        // Enforce new minRange
        this.setViewRange(this.start, this.stop, false);
    }

    /**
     * The maximum possible visible time range.
     */
    get maxRange() { return this._maxRange; }
    set maxRange(maxRange: number | undefined) {
        this._maxRange = maxRange ?? undefined;
        // Enforce new maxRange
        this.setViewRange(this.start, this.stop, false);
    }

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
     * In general it should not be needed to use this method. Bands and decorations
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

    /**
     * Register a listener that receives updates whenever the time range selection
     * has changed.
     */
    addViewportSelectionListener(listener: (ev: ViewportSelectionEvent) => void) {
        this.eventListeners.viewportselection.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving viewport
     * selection events.
     */
    removeViewportSelectionListener(listener: (ev: ViewportSelectionEvent) => void) {
        this.eventListeners.viewportselection = this.eventListeners.viewportselection
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
        this.setViewRange(start, stop, animate);
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
        this.setViewRange(start, stop, animate);
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
     * Returns all Band instances bound to this Timeline instance.
     */
    getBands() {
        return this._drawables.filter(l => l instanceof Band) as Band[];
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
     * Zooms in with a scale factor of 0.5 (half the current range).
     */
    zoomIn() {
        this.zoom(0.5);
    }

    /**
     * Zooms out with a scale factor of 2 (twice the current range).
     */
    zoomOut() {
        this.zoom(2);
    }

    /**
     * Zoom by a scale factor relative to the current range.
     * For example: 2 shows twice the current range, 0.5 shows
     * half the current range.
     *
     * @param relto time around which to center the zoom. If unspecified, the
     *              zoom is around the current centered time.
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
        this.setViewRange(start, stop, animate);
    }

    get background() { return this._background; };
    set background(background: FillStyle) {
        this._background = background;
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

    get bandBorderColor() { return this._bandBorderColor; }
    set bandBorderColor(bandBorderColor: string) {
        this._bandBorderColor = bandBorderColor;
        this.requestRepaint();
    }

    get bandBorderWidth() { return this._bandBorderWidth; }
    set bandBorderWidth(bandBorderWidth: number) {
        this._bandBorderWidth = bandBorderWidth;
        this.requestRepaint();
    }

    private drawScreen() {
        for (const drawable of this._drawables) {
            drawable.beforeDraw(this.g);
        }

        const bands = this.getBands().filter(l => l.frozen)
            .concat(this.getBands().filter(l => !l.frozen));

        let y = 0;
        for (const band of bands) {
            band.coords.x = 0;
            band.coords.y = y;
            band.coords.width = this.mainWidth;
            band.coords.height = band.marginTop + band.contentHeight + band.marginBottom;

            y += band.height + (band.borderWidth ?? this.bandBorderWidth);
        }

        this.rootPanel.style.height = this.targetElement.clientHeight + 'px';

        if (y > this.scrollPanel.clientHeight) {
            this.scrollPanel.style.overflowY = 'scroll';
        } else {
            this.scrollPanel.style.overflowY = 'hidden';
        }

        let width = this.scrollPanel.clientWidth;
        const height = Math.max(y, this.scrollPanel.clientHeight);
        this.g.resize(width, height);

        this.g.fillCanvas(this.background);
        this.sidebar?.drawContent(this.g);

        const offscreen = this.g.createChild(this.mainWidth, height);
        const x = this.sidebar?.clippedWidth || 0;
        this.drawOffscreen(offscreen);
        this.g.copy(offscreen, x, 0);

        this.drawFrozenTop();
    }

    private drawOffscreen(g: Graphics) {
        for (const drawable of this._drawables) {
            if (drawable instanceof Band) {
                g.fillRect({
                    x: drawable.x,
                    y: drawable.y,
                    width: g.canvas.width,
                    height: drawable.height,
                    fill: drawable.background,
                });
            }
        }

        for (const drawable of this._drawables) {
            drawable.drawUnderlay(g);

            // Bottom horizontal divider
            if (drawable instanceof Band) {
                const band = drawable as Band;
                const borderWidth = band.borderWidth ?? this.bandBorderWidth;
                if (borderWidth) {
                    const dividerY = drawable.y + drawable.height + (borderWidth / 2);
                    g.strokePath({
                        color: band.borderColor || this.bandBorderColor,
                        lineWidth: borderWidth,
                        path: new Path(0, dividerY).lineTo(g.canvas.width, dividerY),
                    });
                }
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
            fill: this._unselectedBackground,
        });
        g.fillRect({
            x: x2,
            y: 0,
            width: g.canvas.width - x2,
            height: g.canvas.height,
            fill: this._unselectedBackground,
        });

        g.fillRect({
            x: x1,
            y: 0,
            width: g.canvas.width,
            height: g.canvas.height,
            fill: this._selectedBackground,
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

    // Draw frozen header in separate DOM canvas so that it is still
    // possible to image dump the entire main canvas.
    private drawFrozenTop() {
        const frozenCtx = this.frozenGraphics.ctx;
        const width = this.g.canvas.width;

        let height = 0;
        for (const band of this.getBands()) {
            if (band.frozen) {
                height += band.height + (band.borderWidth ?? this.bandBorderWidth);
            }
        }

        resizeCanvas(this.frozenGraphics.canvas, width, height);
        if (height) {
            frozenCtx.drawImage(this.g.canvas, 0, 0);
        }
    }
}
