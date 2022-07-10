import { FillStyle } from '../graphics/FillStyle';
import { Graphics } from '../graphics/Graphics';
import { Drawable } from './Drawable';
import { HeaderClickEvent } from './HeaderClickEvent';

export interface DrawCoordinates {
    x: number;
    y: number;
    width: number;
    height: number;
}

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
    private _marginBottom = 0;
    private _marginTop = 0;

    private offscreen?: Graphics;

    /** @hidden */
    coords: DrawCoordinates = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };

    /** @hidden */
    headerClickListeners: Array<(ev: HeaderClickEvent) => void> = [];

    /**
     * Register a listener that receives updates when a line header is clicked.
     */
    addHeaderClickListener(listener: (ev: HeaderClickEvent) => void) {
        this.headerClickListeners.push(listener);
        this.reportMutation();
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * header click events.
     */
    removeHeaderClickListener(listener: (ev: HeaderClickEvent) => void) {
        this.headerClickListeners = this.headerClickListeners.filter(el => (el !== listener));
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
    get marginTop() { return this._marginTop; }
    set marginTop(marginTop: number) {
        this._marginTop = marginTop;
        this.reportMutation();
    }

    /**
     * Whitespace in points between the bottom of this band
     * and band content.
     */
    get marginBottom() { return this._marginBottom; }
    set marginBottom(marginBottom: number) {
        this._marginBottom = marginBottom;
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
            g.copy(this.offscreen, this.x, this.y + this.marginTop);
        }
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
