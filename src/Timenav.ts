import { AnimatableProperty } from './AnimatableProperty';
import { Bounds } from './Bounds';
import { Decoration } from './Decoration';
import { DefaultSidebar } from './DefaultSidebar';
import { EventHandling } from './EventHandling';
import { Line } from './Line';
import { Sidebar } from './Sidebar';
import { TimeLocator } from './TimeLocator';
import * as utils from './utils';

export class Timenav {

    private _sidebar?: Sidebar;

    private _lines: Line<any>[] = [];
    private _decorations: Decoration[] = [];

    private rootPanel: HTMLDivElement;
    private scrollPanel: HTMLDivElement;
    private ctx: CanvasRenderingContext2D;

    private _start: AnimatableProperty;
    private _stop: AnimatableProperty;

    frameTime?: number;

    private repaintRequested = false;
    private autoRepaintDelay = 1000;

    // A canvas outside of the scrollpane
    private frozenCanvas: HTMLCanvasElement;

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
    private _fontFamily = 'Verdana, Geneva, sans-serif';
    private _textSize = 10;

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
            // console.log('scroll', this.scrollPane.scrollTop);
        });

        new EventHandling(this, canvas);

        this.frozenCanvas = document.createElement('canvas');
        this.frozenCanvas.className = 'timenav-frozen';
        this.frozenCanvas.style.position = 'absolute';
        this.frozenCanvas.style.top = '0';
        this.frozenCanvas.style.left = '0';
        this.frozenCanvas.style.pointerEvents = 'none';
        this.rootPanel.appendChild(this.frozenCanvas);

        this.sidebar = new DefaultSidebar(this);

        window.requestAnimationFrame((t) => this.step(t));

        // Periodically redraw everything (used by continuously changing elements)
        window.setInterval(() => this.requestRepaint(), this.autoRepaintDelay);
    }

    createAnimatableProperty(value: number) {
        const property = new AnimatableProperty(value);
        this.animatableProperties.push(property);
        return property;
    }

    private step(t: number) {
        window.requestAnimationFrame((t) => this.step(t));
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
    setBounds(bounds: Bounds, animate = true) {
        if (this.animated && animate) {
            this._start.setTransition(this.frameTime, bounds.start);
            this._stop.setTransition(this.frameTime, bounds.stop);
        } else {
            this._start.value = bounds.start;
            this._stop.value = bounds.stop;
        }
        this.requestRepaint();
    }

    /**
     * Returns the leftmost visible start time.
     */
    get start() { return this._start.value; }

    /**
     * Returns the rightmost visible stop time.
     */
    get stop() { return this._stop.value; }

    get width() {
        return this.ctx.canvas.width;
    }

    get sidebar() { return this._sidebar; }
    set sidebar(sidebar: Sidebar | undefined) {
        this._sidebar = sidebar;
        if (sidebar) {
            sidebar.addMutationListener(() => this.requestRepaint());
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

    get mainWidth() {
        let sidebarWidth = this.sidebar?.clippedWidth || 0;
        return this.ctx.canvas.width - sidebarWidth;
    }

    addLine<T extends Line<any>>(line: T): T {
        line.addMutationListener(() => this.requestRepaint());
        this._lines.push(line);
        this.requestRepaint();
        return line;
    }

    addNowLocator() {
        return this.addTimeLocator(() => new Date().getTime());
    }

    addTimeLocator(timeProvider: () => number) {
        return this.addDecoration(new TimeLocator(timeProvider));
    }

    addDecoration<T extends Decoration>(decoration: T): T {
        decoration.addMutationListener(() => this.requestRepaint());
        this._decorations.push(decoration);
        this.requestRepaint();
        return decoration;
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
        this.setBounds({ start, stop }, animate);
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
        this.setBounds({ start, stop }, animate);
    }

    set center(time: number) {
        this.panTo(time, false);
    }

    get center() {
        return (this.stop - this.start) / 2;
    }

    getLines() {
        return [...this._lines];
    }

    getDecorations() {
        return [...this._decorations];
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
        this.setBounds({ start, stop }, animate);
    }

    get backgroundColor() { return this._backgroundOddColor; }
    set backgroundColor(backgroundColor: string) {
        this._backgroundOddColor = backgroundColor;
        this._backgroundEvenColor = backgroundColor;
        this.requestRepaint();
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

    private drawScreen() {
        let innerHeight = 0;
        for (const line of this._lines) {
            line.calculateLayout();
            innerHeight += line.height;
        }

        this.rootPanel.style.height = this.targetElement.clientHeight + 'px';

        if (innerHeight > this.scrollPanel.clientHeight) {
            this.scrollPanel.style.overflowY = 'scroll';
        } else {
            this.scrollPanel.style.overflowY = 'hidden';
        }

        let width = this.scrollPanel.clientWidth;
        const height = Math.max(innerHeight, this.scrollPanel.clientHeight);
        utils.resizeCanvas(this.ctx.canvas, width, height);

        this.ctx.fillStyle = this.backgroundOddColor;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.sidebar?.draw(this.ctx);

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

        const lines = this._lines.filter(l => l.frozen)
            .concat(this._lines.filter(l => !l.frozen));

        let y = 0;
        let backgroundColor = this.backgroundOddColor;
        for (const line of lines) {
            line.draw(ctx, this, y, backgroundColor);
            backgroundColor = (backgroundColor === this.backgroundOddColor) ? this.backgroundEvenColor : this.backgroundOddColor;
            y += line.height;
        }

        for (const decoration of this.getDecorations()) {
            decoration.draw(ctx, this);
        }

        return canvas;
    }

    // Draw frozen header in separate DOM canvas so that it is still possible to image dump
    // the entire main canvas.
    private drawFrozenTop() {
        const frozenCtx = this.frozenCanvas.getContext('2d')!;
        const width = this.ctx.canvas.width;

        let height = 0;
        for (const line of this._lines) {
            if (line.frozen) {
                height += line.height;
            }
        }

        utils.resizeCanvas(this.frozenCanvas, width, height);
        if (height) {
            frozenCtx.drawImage(this.ctx.canvas, 0, 0);
        }
    }
}
