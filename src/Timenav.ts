import { AnimatableProperty } from './AnimatableProperty';
import { DefaultSidebar } from './DefaultSidebar';
import { Drawable } from './Drawable';
import { EventHandler, Tool } from './EventHandler';
import { TimenavEvent, TimenavEventHandlers, TimenavEventMap } from './events';
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

export class Timenav {

    private _sidebar?: Sidebar;
    private _drawables: Drawable[] = [];

    private rootPanel: HTMLDivElement;
    private scrollPanel: HTMLDivElement;
    private ctx: CanvasRenderingContext2D;

    private _start: AnimatableProperty;
    private _stop: AnimatableProperty;
    private selection?: { start: number, stop: number; };

    frameTime?: number;

    private repaintRequested = false;
    private autoRepaintDelay = 1000;

    // A canvas outside of the scrollpane
    private frozenCanvas: HTMLCanvasElement;

    private eventListeners: TimenavEventHandlers = {
        viewportmousemove: [],
        viewportmouseout: [],
    };

    private eventHandler: EventHandler;

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
        this.rootPanel.className = 'timenav-root';
        this.rootPanel.style.overflow = 'hidden';
        this.rootPanel.style.position = 'relative';
        this.rootPanel.style.fontSize = '0';
        targetElement.appendChild(this.rootPanel);

        this.scrollPanel = document.createElement('div');
        this.scrollPanel.className = 'timenav-scroll';
        this.scrollPanel.style.height = '100%';
        this.scrollPanel.style.overflow = 'hidden';
        this.scrollPanel.style.position = 'relative';
        this.scrollPanel.style.fontSize = '0';
        this.rootPanel.appendChild(this.scrollPanel);

        const canvas = document.createElement('canvas');
        this.scrollPanel.appendChild(canvas);
        this.ctx = canvas.getContext('2d')!;

        this._start = this.createAnimatableProperty(0);
        this._stop = this.createAnimatableProperty(100);

        this.scrollPanel.addEventListener('scroll', () => {
            this.requestRepaint();
        });

        this.eventHandler = new EventHandler(this, canvas);

        this.frozenCanvas = document.createElement('canvas');
        this.frozenCanvas.className = 'timenav-frozen';
        this.frozenCanvas.style.position = 'absolute';
        this.frozenCanvas.style.top = '0';
        this.frozenCanvas.style.left = '0';
        this.frozenCanvas.style.pointerEvents = 'none';
        this.rootPanel.appendChild(this.frozenCanvas);

        this.sidebar = new DefaultSidebar(this);

        window.requestAnimationFrame(t => this.step(t));

        // Periodically redraw everything (used by continuously changing elements)
        window.setInterval(() => this.requestRepaint(), this.autoRepaintDelay);
    }

    disconnect() {
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
        this.requestRepaint();
    }

    setSelection(start: number, stop: number) {
        if (stop > start) {
            this.selection = { start, stop };
        } else {
            this.selection = { start: stop, stop: start };
        }
        this.requestRepaint();
    }

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
     * The pixel width of this Timenav (incl. sidebar)
     */
    get width() {
        return this.ctx.canvas.width;
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

    /**
    * Returns the content of the current canvas as an image.
    */
    toDataURL(type = 'image/png', quality?: any) {
        return this.ctx.canvas.toDataURL(type, quality);
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
     * The pixel width of this Timenav (excl. sidebar)
     */
    get mainWidth() {
        let sidebarWidth = this.sidebar?.clippedWidth || 0;
        return this.ctx.canvas.width - sidebarWidth;
    }

    /**
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

    addEventListener<K extends keyof TimenavEventMap>(type: K, listener: ((ev: TimenavEventMap[K]) => void)): void;
    addEventListener(type: string, listener: (ev: TimenavEvent) => void): void {
        if (!(type in this.eventListeners)) {
            throw new Error(`Unknown event '${type}'`);
        }
        this.eventListeners[type].push(listener);
    }

    removeEventListener<K extends keyof TimenavEventMap>(type: K, listener: ((ev: TimenavEventMap[K]) => void)): void;
    removeEventListener(type: string, listener: (ev: TimenavEvent) => void): void {
        if (!(type in this.eventListeners)) {
            throw new Error(`Unknown event '${type}'`);
        }
        this.eventListeners[type] = this.eventListeners[type]
            .filter((el: any) => (el !== listener));
    }

    fireEvent(type: string, event: TimenavEvent) {
        const listeners = this.eventListeners[type];
        listeners.forEach(listener => listener(event));
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
    get center() { return (this.stop - this.start) / 2; }
    set center(time: number) {
        this.panTo(time, false);
    }

    getLines() {
        return this._drawables.filter(l => l instanceof Line) as Line<unknown>[];
    }

    /**
     * Returns the x position in svg points for the given date
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
     */
    zoom(factor: number, animate = true) {
        if (factor <= 0) {
            throw new Error('Zoom factor should be a positive number');
        }
        const prevMillis = this.stop - this.start;
        const nextMillis = prevMillis * factor;
        const delta = (nextMillis - prevMillis) / 2;

        const start = this.start - delta;
        const stop = this.stop + delta;
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
        const lines = this.getLines().filter(l => l.frozen)
            .concat(this.getLines().filter(l => !l.frozen));

        let y = 0;
        let contentHeight = 0;
        for (const line of lines) {
            line.coords.x = 0;
            line.coords.y = y;
            line.coords.width = this.mainWidth;
            line.coords.height = line.calculatePreferredHeight();

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
        resizeCanvas(this.ctx.canvas, width, height);

        this.ctx.fillStyle = this.backgroundOddColor;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.sidebar?.drawContent(this.ctx);

        const tmpCanvas = this.drawOffscreen(this.mainWidth, height);
        const x = this.sidebar?.clippedWidth || 0;
        this.ctx.drawImage(tmpCanvas, x, 0);

        this.drawFrozenTop();
    }

    private drawOffscreen(width: number, height: number) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        for (const drawable of this._drawables) {
            drawable.beforeDraw();
        }

        let backgroundColor = this.backgroundOddColor;
        for (const drawable of this._drawables) {

            // Default (striped) background
            if (drawable instanceof Line) {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(drawable.x, drawable.y, ctx.canvas.width, drawable.height);
                backgroundColor = (backgroundColor === this.backgroundOddColor) ? this.backgroundEvenColor : this.backgroundOddColor;
            }

            drawable.drawUnderlay(ctx);

            // Bottom horizontal divider
            if (drawable instanceof Line) {
                ctx.lineWidth = this.rowBorderLineWidth;
                ctx.strokeStyle = this.rowBorderColor;
                const dividerY = drawable.y + drawable.height + 0.5;
                ctx.beginPath();
                ctx.moveTo(0, dividerY);
                ctx.lineTo(ctx.canvas.width, dividerY);
                ctx.stroke();
            }
        }

        for (const drawable of this._drawables) {
            drawable.drawContent(ctx);
        }

        for (const drawable of this._drawables) {
            drawable.drawOverlay(ctx);
        }

        this.drawSelection(ctx);

        return canvas;
    }

    private drawSelection(ctx: CanvasRenderingContext2D) {
        if (!this.selection) {
            return;
        }

        const x1 = Math.round(this.positionTime(this.selection.start));
        const x2 = Math.round(this.positionTime(this.selection.stop));

        ctx.globalAlpha = this._unselectedOpacity;
        ctx.fillStyle = this._unselectedBackgroundColor;
        ctx.fillRect(0, 0, x1, ctx.canvas.height);
        ctx.fillRect(x2, 0, ctx.canvas.width - x2, ctx.canvas.height);

        ctx.globalAlpha = this._selectedOpacity;
        ctx.fillStyle = this._selectedBackgroundColor;
        ctx.fillRect(x1, 0, ctx.canvas.width - x2, ctx.canvas.height);

        ctx.globalAlpha = 1;
        ctx.strokeStyle = this._selectedLineColor;
        ctx.lineWidth = 1;
        ctx.setLineDash(this._selectedLineDash);
        ctx.beginPath();
        ctx.moveTo(x1 + 0.5, 0);
        ctx.lineTo(x1 + 0.5, ctx.canvas.height);
        ctx.moveTo(x2 - 0.5, 0);
        ctx.lineTo(x2 - 0.5, ctx.canvas.height);
        ctx.stroke();
    }

    // Draw frozen header in separate DOM canvas so that it is still possible to image dump
    // the entire main canvas.
    private drawFrozenTop() {
        const frozenCtx = this.frozenCanvas.getContext('2d')!;
        const width = this.ctx.canvas.width;

        let height = 0;
        for (const line of this.getLines()) {
            if (line.frozen) {
                height += line.height;
            }
        }

        resizeCanvas(this.frozenCanvas, width, height);
        if (height) {
            frozenCtx.drawImage(this.ctx.canvas, 0, 0);
        }
    }
}
