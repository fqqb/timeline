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
export declare abstract class Band extends Drawable {
    private _label?;
    private _frozen;
    private _background;
    private _headerBackground;
    private _borderWidth?;
    private _borderColor?;
    private _marginBottom;
    private _marginTop;
    private offscreen?;
    /** @hidden */
    coords: DrawCoordinates;
    /** @hidden */
    headerClickListeners: Array<(ev: HeaderClickEvent) => void>;
    /**
     * Register a listener that receives updates when a line header is clicked.
     */
    addHeaderClickListener(listener: (ev: HeaderClickEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * header click events.
     */
    removeHeaderClickListener(listener: (ev: HeaderClickEvent) => void): void;
    /**
     * Human-friendly label for this band. Used in sidebar.
     */
    get label(): string | undefined;
    set label(label: string | undefined);
    /**
     * Background of this band.
     */
    get background(): FillStyle;
    set background(background: FillStyle);
    /**
     * Background of the header of this band.
     */
    get headerBackground(): FillStyle;
    set headerBackground(headerBackground: FillStyle);
    /**
     * Border width of this band. If undefined, the width
     * is determined by the property 'bandBorderWidth'
     * of the Timeline instance.
     */
    get borderWidth(): number | undefined;
    set borderWidth(borderWidth: number | undefined);
    /**
     * Border color of this band. If undefined, the color
     * is determined by the property 'bandBorderColor'
     * of the Timeline instance.
     */
    get borderColor(): string | undefined;
    set borderColor(borderColor: string | undefined);
    /**
     * Whitespace in points between the top of this band and
     * band content.
     */
    get marginTop(): number;
    set marginTop(marginTop: number);
    /**
     * Whitespace in points between the bottom of this band
     * and band content.
     */
    get marginBottom(): number;
    set marginBottom(marginBottom: number);
    /**
     * If set to true, this band stays fixed on top, even while
     * scrolling vertically.
     *
     * Frozen bands precede non-frozen bands, regardless of the order in
     * which bands were added.
     */
    get frozen(): boolean;
    set frozen(frozen: boolean);
    beforeDraw(g: Graphics): void;
    /**
     * Implementations should return required content height
     * (excluding margins) during the current draw operation.
     */
    abstract calculateContentHeight(g: Graphics): number;
    abstract drawBandContent(g: Graphics): void;
    drawContent(g: Graphics): void;
    /**
     * The height of the band content (excluding margins).
     */
    get contentHeight(): number;
    /**
     * The height of this band.
     */
    get height(): number;
    /**
     * The width of this band.
     */
    get width(): number;
    /**
     * The X-coordinate of this band.
     */
    get x(): number;
    /**
     * The Y-coordinate of this band.
     */
    get y(): number;
}
