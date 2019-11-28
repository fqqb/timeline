import { Band } from './Band';
import { Decoration } from './Decoration';
import { EventArea } from './EventArea';
import { EventBand } from './EventBand';
import { EventHandling } from './EventHandling';
import { Sidebar } from './Sidebar';
import { TimeLocator } from './TimeLocator';
import { Timescale } from './Timescale';

export class Timeline {

    private bands: Band[] = [];
    private decorations: Decoration[] = [];

    private rootPanel: HTMLDivElement;
    private scrollPanel: HTMLDivElement;
    private canvas: HTMLCanvasElement;

    private start: Date;
    private stop: Date;

    private sidebar: Sidebar;
    private eventArea: EventArea;

    private _backgroundColor = 'white';
    private _foregroundColor = 'grey';
    private _fontFamily = 'Verdana, Geneva, sans-serif';
    private _textSize = 10;
    private _dividerColor = '#d1d5da';

    // If true, the render loop re-draws the canvas
    private dirty = false;
    private autoRepaintDelay = 1000;

    constructor(parent: HTMLDivElement) {
        // Wrap everything, so we don't modify the user-managed container
        this.rootPanel = document.createElement('div');
        this.rootPanel.style.width = '100%';
        this.rootPanel.style.height = '100%';
        this.rootPanel.style.overflow = 'hidden';
        this.rootPanel.style.position = 'relative';
        this.rootPanel.style.fontSize = '0';
        parent.appendChild(this.rootPanel);

        this.scrollPanel = document.createElement('div');
        this.scrollPanel.style.width = '100%';
        this.scrollPanel.style.height = '100%';
        this.scrollPanel.style.overflowX = 'hidden';
        this.scrollPanel.style.overflowY = 'scroll';
        this.scrollPanel.style.position = 'relative';
        this.scrollPanel.style.fontSize = '0';
        this.rootPanel.appendChild(this.scrollPanel);

        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.scrollPanel.appendChild(this.canvas);

        this.sidebar = new Sidebar(this, this.canvas, this.rootPanel);
        this.eventArea = new EventArea(this, this.canvas, this.rootPanel);

        // Default to a 'today' range (using local time)
        this.start = new Date();
        this.start.setHours(0, 0, 0, 0);
        this.stop = new Date(this.start.getTime());
        this.stop.setDate(this.stop.getDate() + 1);

        // this.repaint();
        this.renderLoop();

        // Ensure we periodically redraw everything (used by continuously changing elements)
        window.setInterval(() => this.repaint(), this.autoRepaintDelay);

        this.scrollPanel.addEventListener('scroll', () => {
            this.repaint();
            // console.log('scroll', this.scrollPane.scrollTop);
        });

        new EventHandling(this, this.canvas);
    }

    private renderLoop(timeout = 30) { // The lower the value, the more responsive, but also the higher CPU.
        window.setTimeout(() => this.renderLoop(timeout), timeout);

        // Limit CPU usage to when it's really needed
        if (this.dirty) {
            this.drawScreen();
            this.dirty = false;
        }
    }

    /**
     * Sets the visible range.
     * 
     * @param start the leftmost visible start date.
     * @param stop the rightmost visible stop date.
     */
    public setRange(start: Date, stop: Date) {
        this.start = start;
        this.stop = stop;
        this.repaint();
    }

    /**
     * Returns the leftmost visible start date.
     */
    public getStart() {
        return this.start;
    }

    /**
     * Returns the rightmost visible stop date.
     */
    public getStop() {
        return this.stop;
    }

    public getWidth() {
        return this.canvas.width;
    }

    public getSidebar() {
        return this.sidebar;
    }

    /**
    * Returns the content of the current canvas as an image.
    */
    public toDataURL(type = 'image/png', quality?: any) {
        return this.canvas.toDataURL(type, quality);
    }

    /**
     * Request a repaint of the canvas. The repaint is done async from a
     * UI render loop. In general it is not necessary to trigger manual
     * repaints. Bands and decorations trigger repaints automatically.
     */
    public repaint() {
        this.dirty = true;
    }

    public getMainWidth() {
        return this.canvas.width - this.sidebar.width;
    }

    public addTimescale(label?: string) {
        return this.addBand(new Timescale(this, label));
    }

    public addEventBand(label?: string) {
        return this.addBand(new EventBand(this, label));
    }

    public addBand<T extends Band>(band: T): T {
        this.bands.push(band);
        this.repaint();
        return band;
    }

    public addNowLocator() {
        return this.addTimeLocator(() => new Date());
    }

    public addTimeLocator(timeProvider: () => Date) {
        return this.addDecoration(new TimeLocator(this, timeProvider));
    }

    public addDecoration<T extends Decoration>(decoration: T): T {
        this.decorations.push(decoration);
        this.repaint();
        return decoration;
    }

    /**
     * Returns a date matching the provided x offset
     */
    moveX(points: number) {
        const totalMillis = this.stop.getTime() - this.start.getTime();
        const totalPoints = this.canvas.width - this.sidebar.width;
        const offsetMillis = (points / totalPoints) * totalMillis;

        const newStart = new Date(this.start.getTime() + offsetMillis);
        const newStop = new Date(this.stop.getTime() + offsetMillis);
        this.setRange(newStart, newStop);
    }

    /**
     * Reveal the specified date while keeping the current time range.
     * 
     * @param date target date to reveal
     * @param position where to position the date on the canvas (0.5 = center)
     */
    reveal(date: Date, position = 0.5) {
        const totalMillis = this.stop.getTime() - this.start.getTime();

        const newStart = new Date(date.getTime() - (totalMillis * position));
        const newStop = new Date(date.getTime() + (totalMillis * (1 - position)));
        this.setRange(newStart, newStop);
    }

    getBands() {
        return this.bands;
    }

    getDecorations() {
        return this.decorations;
    }

    /**
     * Returns the x position in svg points for the given date
     */
    positionDate(date: Date) {
        return this.pointsBetween(this.start, date);
    }

    /**
     * Returns point width between two dates. The sign
     * is negative if date2 comes after date1.
     */
    pointsBetween(date1: Date, date2: Date) {
        const millis = date2.getTime() - date1.getTime();
        const totalMillis = this.stop.getTime() - this.start.getTime();
        const mainWidth = this.canvas.width - this.sidebar.width;
        return mainWidth * (millis / totalMillis);
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
    zoom(factor: number) {
        if (factor <= 0) {
            throw new Error('Zoom factor should be a positive number');
        }
        const prevMillis = this.stop.getTime() - this.start.getTime();
        const nextMillis = prevMillis * factor;
        const delta = (nextMillis - prevMillis) / 2;
        const newStart = new Date(this.start.getTime() - delta);
        const newStop = new Date(this.stop.getTime() + delta);
        this.setRange(newStart, newStop);
    }

    get backgroundColor() {
        return this._backgroundColor;
    }

    set backgroundColor(backgroundColor: string) {
        this._backgroundColor = backgroundColor;
        this.repaint();
    }

    get foregroundColor() {
        return this._foregroundColor;
    }

    set foregroundColor(foregroundColor: string) {
        this._foregroundColor = foregroundColor;
        this.repaint();
    }

    get fontFamily() {
        return this._fontFamily;
    }

    set fontFamily(fontFamily: string) {
        this._fontFamily = fontFamily;
        this.repaint();
    }

    get textSize() {
        return this._textSize;
    }

    set textSize(textSize: number) {
        this._textSize = textSize;
        this.repaint();
    }

    get dividerColor() {
        return this._dividerColor;
    }

    set dividerColor(dividerColor: string) {
        this._dividerColor = dividerColor;
        this.repaint();
    }

    private drawScreen() {
        let totalHeight = 0;
        for (const band of this.bands) {
            band.calculateLayout();
            totalHeight += band.height;
        }

        totalHeight = Math.max(totalHeight, this.rootPanel.clientHeight);

        // Update size (in case of changed HTML element bounds)
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = totalHeight;

        this.canvas.style.width = '100%';
        this.canvas.style.height = totalHeight + 'px';

        this.clearScreen();
        this.sidebar.draw();
        this.eventArea.draw();
    }

    private clearScreen() {
        const ctx = this.canvas.getContext('2d')!;

        // Always clear (background may be transparent)
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
