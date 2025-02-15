import { FillStyle } from '../graphics/FillStyle';
import { Graphics } from '../graphics/Graphics';
import { MouseHitEvent } from '../graphics/MouseHitEvent';
import { REGION_ID_VIEWPORT } from '../Timeline';
import { BandClickEvent } from './BandClickEvent';
import { BandMouseEnterEvent } from './BandMouseEnterEvent';
import { BandMouseLeaveEvent } from './BandMouseLeaveEvent';
import { BandMouseMoveEvent } from './BandMouseMoveEvent';
import { Drawable } from './Drawable';

export interface DrawCoordinates {
    x: number;
    y: number;
    width: number;
    height: number;
}

let bandSequence = 1;

/**
 * Base type for bands.
 */
export abstract class Band extends Drawable {

    private _label?: string;
    private _frozen = false;
    private _background: FillStyle = 'transparent';
    private _headerBackground: FillStyle = 'transparent';
    private _borderWidth?: number;
    private _borderColor?: string;
    private _paddingBottom = 0;
    private _paddingTop = 0;

    private offscreen?: Graphics;

    /** @hidden */
    coords: DrawCoordinates = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };

    /** @hidden */
    headerClickListeners: Array<(ev: BandClickEvent) => void> = [];

    /** @hidden */
    headerMouseEnterListeners: Array<(ev: BandMouseEnterEvent) => void> = [];

    /** @hidden */
    headerMouseMoveListeners: Array<(ev: BandMouseMoveEvent) => void> = [];

    /** @hidden */
    headerMouseLeaveListeners: Array<(ev: BandMouseLeaveEvent) => void> = [];

    /** @hidden */
    mouseEnterListeners: Array<(ev: BandMouseEnterEvent) => void> = [];

    /** @hidden */
    mouseMoveListeners: Array<(ev: BandMouseMoveEvent) => void> = [];

    /** @hidden */
    mouseLeaveListeners: Array<(ev: BandMouseLeaveEvent) => void> = [];

    protected bandRegionId = 'band_' + bandSequence++;

    /**
     * Register a listener that receives updates when a line header is clicked.
     */
    addHeaderClickListener(listener: (ev: BandClickEvent) => void) {
        this.headerClickListeners.push(listener);
        this.reportMutation();
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * header click events.
     */
    removeHeaderClickListener(listener: (ev: BandClickEvent) => void) {
        this.headerClickListeners = this.headerClickListeners.filter(el => (el !== listener));
        this.reportMutation();
    }

    /**
     * Register a listener that receives updates when the mouse enters a band's header.
     */
    addHeaderMouseEnterListener(listener: (ev: BandMouseEnterEvent) => void) {
        this.headerMouseEnterListeners.push(listener);
        this.reportMutation();
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * band header mouse-enter events.
     */
    removeHeaderMouseEnterListener(listener: (ev: BandMouseEnterEvent) => void) {
        this.headerMouseEnterListeners = this.headerMouseEnterListeners.filter(el => (el !== listener));
        this.reportMutation();
    }

    /**
     * Register a listener that receives updates when the mouse is moving over
     * a band's header.
     */
    addHeaderMouseMoveListener(listener: (ev: BandMouseMoveEvent) => void) {
        this.headerMouseMoveListeners.push(listener);
        this.reportMutation();
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * band header mouse-move events.
     */
    removeHeaderMouseMoveListener(listener: (ev: BandMouseMoveEvent) => void) {
        this.headerMouseMoveListeners = this.headerMouseMoveListeners.filter(el => (el !== listener));
        this.reportMutation();
    }

    /**
     * Register a listener that receives updates when the mouse is moving
     * outside a band's header.
     */
    addHeaderMouseLeaveListener(listener: (ev: BandMouseLeaveEvent) => void) {
        this.headerMouseLeaveListeners.push(listener);
        this.reportMutation();
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * band header mouse-leave events.
     */
    removeHeaderMouseLeaveListener(listener: (ev: BandMouseLeaveEvent) => void) {
        this.headerMouseLeaveListeners = this.headerMouseLeaveListeners.filter(el => (el !== listener));
        this.reportMutation();
    }

    /**
     * Register a listener that receives updates when the mouse enters a band.
     */
    addMouseEnterListener(listener: (ev: BandMouseEnterEvent) => void) {
        console.log('addmouseenter');
        this.mouseEnterListeners.push(listener);
        this.reportMutation();
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * band mouse-enter events.
     */
    removeMouseEnterListener(listener: (ev: BandMouseEnterEvent) => void) {
        this.mouseEnterListeners = this.mouseEnterListeners.filter(el => (el !== listener));
        this.reportMutation();
    }

    /**
     * Register a listener that receives updates when the mouse is moving over
     * a band.
     */
    addMouseMoveListener(listener: (ev: BandMouseMoveEvent) => void) {
        this.mouseMoveListeners.push(listener);
        this.reportMutation();
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * band mouse-move events.
     */
    removeMouseMoveListener(listener: (ev: BandMouseMoveEvent) => void) {
        this.mouseMoveListeners = this.mouseMoveListeners.filter(el => (el !== listener));
        this.reportMutation();
    }

    /**
     * Register a listener that receives updates when the mouse is moving
     * outside a band.
     */
    addMouseLeaveListener(listener: (ev: BandMouseLeaveEvent) => void) {
        this.mouseLeaveListeners.push(listener);
        this.reportMutation();
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * band mouse-leave events.
     */
    removeMouseLeaveListener(listener: (ev: BandMouseLeaveEvent) => void) {
        this.mouseLeaveListeners = this.mouseLeaveListeners.filter(el => (el !== listener));
        this.reportMutation();
    }

    /**
     * Human-friendly label for this band. Used in sidebar.
     */
    get label() { return this._label; }
    set label(label: string | undefined) {
        this._label = label;
        this.reportMutation();
    }

    /**
     * Background of this band.
     */
    get background() { return this._background; }
    set background(background: FillStyle) {
        this._background = background;
        this.reportMutation();
    }

    /**
     * Background of the header of this band.
     */
    get headerBackground() { return this._headerBackground; }
    set headerBackground(headerBackground: FillStyle) {
        this._headerBackground = headerBackground;
        this.reportMutation();
    }

    /**
     * Border width of this band. If undefined, the width
     * is determined by the property 'bandBorderWidth'
     * of the Timeline instance.
     */
    get borderWidth() { return this._borderWidth; }
    set borderWidth(borderWidth: number | undefined) {
        this._borderWidth = borderWidth;
        this.reportMutation();
    }

    /**
     * Border color of this band. If undefined, the color
     * is determined by the property 'bandBorderColor'
     * of the Timeline instance.
     */
    get borderColor() { return this._borderColor; }
    set borderColor(borderColor: string | undefined) {
        this._borderColor = borderColor;
        this.reportMutation();
    }

    /**
     * Whitespace in points between the top of this band and
     * band content.
     */
    get paddingTop() { return this._paddingTop; }
    set paddingTop(paddingTop: number) {
        this._paddingTop = paddingTop;
        this.reportMutation();
    }

    /**
     * Whitespace in points between the bottom of this band
     * and band content.
     */
    get paddingBottom() { return this._paddingBottom; }
    set paddingBottom(paddingBottom: number) {
        this._paddingBottom = paddingBottom;
        this.reportMutation();
    }

    /**
     * If set to true, this band stays fixed on top, even while
     * scrolling vertically.
     *
     * Frozen bands precede non-frozen bands, regardless of the order in
     * which bands were added.
     */
    get frozen() { return this._frozen; }
    set frozen(frozen: boolean) {
        this._frozen = frozen;
        this.reportMutation();
    }

    beforeDraw(g: Graphics) {
        const contentHeight = this.calculateContentHeight(g);
        this.offscreen = g.createChild(this.timeline.mainWidth, contentHeight);

        const hitRegion = this.offscreen.addHitRegion({
            id: this.bandRegionId,
            parentId: REGION_ID_VIEWPORT,
            mouseEnter: evt => {
                const mouseEvent: BandMouseEnterEvent = {
                    clientX: evt.clientX,
                    clientY: evt.clientY,
                    band: this,
                };
                this.mouseEnterListeners.forEach(l => l(mouseEvent));
            },
            mouseMove: evt => {
                const mouseEvent = this.createMouseMoveEvent(evt);
                this.mouseMoveListeners.forEach(l => l(mouseEvent));
            },
            mouseLeave: evt => {
                const mouseEvent: BandMouseLeaveEvent = {
                    clientX: evt.clientX,
                    clientY: evt.clientY,
                    band: this,
                };
                this.mouseLeaveListeners.forEach(l => l(mouseEvent));
            },
        });
        hitRegion.addRect(0, 0, this.timeline.mainWidth, contentHeight);

        this.drawBandContent(this.offscreen);
    }

    /**
     * Implementations should return required content height
     * (excluding margins) during the current draw operation.
     */
    abstract calculateContentHeight(g: Graphics): number;

    abstract drawBandContent(g: Graphics): void;

    drawContent(g: Graphics) {
        if (this.offscreen) {
            g.copy(this.offscreen, this.x, this.y + this.paddingTop);
        }
    }

    protected createMouseMoveEvent(evt: MouseHitEvent): BandMouseMoveEvent {
        const time = this.timeline.timeForCanvasPosition(evt.x);
        return {
            clientX: evt.clientX,
            clientY: evt.clientY,
            band: this,
            time,
        };
    }

    /**
     * The height of the band content (excluding margins).
     */
    get contentHeight() {
        return this.offscreen?.canvas.height || 0;
    }

    /**
     * The height of this band.
     */
    get height() { return this.coords.height; }

    /**
     * The width of this band.
     */
    get width() { return this.coords.width; }

    /**
     * The X-coordinate of this band.
     */
    get x() { return this.coords.x; }

    /**
     * The Y-coordinate of this band.
     */
    get y() { return this.coords.y; }
}
