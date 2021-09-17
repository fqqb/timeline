import { Drawable } from './Drawable';
import { Graphics } from './Graphics';

export interface DrawCoordinates {
    x: number;
    y: number;
    width: number;
    height: number;
}

export abstract class Band extends Drawable {

    private _label?: string;
    private _frozen = false;
    private _backgroundColor?: string;
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

    /**
     * Human-friendly label for this band. Used in sidebar.
     */
    get label() { return this._label; }
    set label(label: string | undefined) {
        this._label = label;
        this.reportMutation();
    }

    /**
     * Background color of this band. If undefined, the background
     * color defaults to an odd/even pattern.
     */
    get backgroundColor() { return this._backgroundColor; }
    set backgroundColor(backgroundColor: string | undefined) {
        this._backgroundColor = backgroundColor;
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

    /** @hidden */
    beforeDraw(g: Graphics) {
        const contentHeight = this.calculateContentHeight(g);
        this.offscreen = g.createChild(this.timeline.mainWidth, contentHeight);
        this.drawBandContent(this.offscreen);
    }

    /**
     * Implementations should return required content height
     * (excluding margins) during the current draw operation.
     *
     * @hidden
     */
    abstract calculateContentHeight(g: Graphics): number;

    /** @hidden */
    abstract drawBandContent(g: Graphics): void;

    /** @hidden */
    drawContent(g: Graphics) {
        if (this.offscreen) {
            g.copy(this.offscreen, this.x, this.y + this.marginTop);
        }
    }

    /** @hidden */
    getContentHeight() {
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
