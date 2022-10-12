import { AnimatableProperty } from './AnimatableProperty';
import { Band } from './drawables/Band';
import { Drawable } from './drawables/Drawable';
import { Sidebar } from './drawables/Sidebar';
import { FillStyle } from './graphics/FillStyle';
import { TimeRange } from './TimeRange';
import { Tool } from './Tool';
import { ViewportChangeEvent } from './ViewportChangeEvent';
import { ViewportDoubleClickEvent } from './ViewportDoubleClickEvent';
import { ViewportMouseLeaveEvent } from './ViewportMouseLeaveEvent';
import { ViewportMouseMoveEvent } from './ViewportMouseMoveEvent';
import { ViewportSelectionEvent } from './ViewportSelectionEvent';
export declare const REGION_ID_VIEWPORT = "viewport";
export declare const REGION_ID_DIVIDER = "divider";
export declare class Timeline {
    private readonly targetElement;
    private _sidebar?;
    private _drawables;
    private rootPanel;
    private scrollPanel;
    private g;
    private _start;
    private _stop;
    private _min?;
    private _max?;
    private _minRange?;
    private _maxRange?;
    private _tool?;
    private selection?;
    /** @hidden */
    frameTime?: number;
    private repaintRequested;
    private frozenGraphics;
    private viewportChangeListeners;
    private viewportSelectionListeners;
    /**
     * If true, some actions (e.g. panBy) animate property transitions.
     */
    animated: boolean;
    private animatableProperties;
    private _background;
    private _foregroundColor;
    private _bandBorderColor;
    private _bandBorderWidth;
    private _fontFamily;
    private _textSize;
    private _unselectedBackground;
    private _selectedBackground;
    private _selectedLineDash;
    private _selectedLineColor;
    private mediaQueryList?;
    private mediaQueryListEventListener;
    private animationFrameRequest?;
    private viewportRegion;
    private dividerRegion;
    constructor(targetElement: HTMLElement);
    /**
     * Free resources used by this Timeline instance (like intervals).
     */
    disconnect(): void;
    createAnimatableProperty(value: number): AnimatableProperty;
    private step;
    /**
     * Sets the visible range.
     */
    setViewRange(start: number, stop: number, animate?: boolean): void;
    /**
     * Returns the currently active selection (if any).
     */
    getSelection(): TimeRange | undefined;
    /**
     * Highlight a time range as being selected.
     *
     * @param start Left bound of the selection window.
     * @param stop Right bound of the selection window.
     */
    setSelection(start: number, stop: number): void;
    /**
     * Clear the current time range selection (if any)
     */
    clearSelection(): void;
    /**
     * The leftmost visible start time.
     */
    get start(): number;
    /**
     * The rightmost visible stop time.
     */
    get stop(): number;
    /**
     * The minimum possible visible time.
     */
    get min(): number | undefined;
    set min(min: number | undefined);
    /**
     * The maximum possible visible time.
     */
    get max(): number | undefined;
    set max(max: number | undefined);
    /**
     * The minimum possible visible time range.
     */
    get minRange(): number | undefined;
    set minRange(minRange: number | undefined);
    /**
     * The maximum possible visible time range.
     */
    get maxRange(): number | undefined;
    set maxRange(maxRange: number | undefined);
    /**
     * The pixel width of this Timeline (incl. sidebar)
     */
    get width(): number;
    /**
     * Optional sidebar. If set, this is positioned left of
     * the main area.
     */
    get sidebar(): Sidebar | undefined;
    set sidebar(sidebar: Sidebar | undefined);
    get cursor(): string;
    set cursor(cursor: string);
    /**
    * Returns the content of the current canvas as an image.
    */
    toDataURL(type?: string, quality?: any): string;
    /**
     * Request a repaint of the canvas.
     *
     * The repaint is done async from a  UI render loop.
     *
     * In general it should not be needed to use this method. Bands and decorations
     * trigger repaints automatically.
     */
    requestRepaint(): void;
    /**
     * The pixel width of this Timeline (excl. sidebar)
     */
    get mainWidth(): number;
    /**
     * Internal method to bind a drawable to this Timeline instance.
     * This method is called in the top-level constructor implementation
     * of a Drawable.
     *
     * @hidden
     */
    add<T extends Drawable>(drawable: T): T;
    /**
     * Register a listener that receives updates when the viewport bounds
     * have changed.
     */
    addViewportChangeListener(listener: (ev: ViewportChangeEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * viewport change events.
     */
    removeViewportChangeListener(listener: (ev: ViewportChangeEvent) => void): void;
    /**
     * Register a listener that recevies updates whenever the viewport
     * is double-clicked.
     */
    addViewportDoubleClickListener(listener: (ev: ViewportDoubleClickEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * viewport double-click events.
     */
    removeViewportDoubleClickListener(listener: (ev: ViewportDoubleClickEvent) => void): void;
    /**
     * Register a listener that receives updates whenever the mouse is moving
     * over the viewport.
     */
    addViewportMouseMoveListener(listener: (ev: ViewportMouseMoveEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * viewport mouse-move events.
     */
    removeViewportMouseMoveListener(listener: (ev: ViewportMouseMoveEvent) => void): void;
    /**
     * Register a listener that receives updates whenever the mouse is moving
     * outside the viewport.
     */
    addViewportMouseLeaveListener(listener: (ev: ViewportMouseLeaveEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * viewport mouse-leave events.
     */
    removeViewportMouseLeaveListener(listener: (ev: ViewportMouseLeaveEvent) => void): void;
    /**
     * Register a listener that receives updates whenever the time range selection
     * has changed.
     */
    addViewportSelectionListener(listener: (ev: ViewportSelectionEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving viewport
     * selection events.
     */
    removeViewportSelectionListener(listener: (ev: ViewportSelectionEvent) => void): void;
    /**
     * Change the the visible range by a distance in pixels.
     *
     * A positive number pans towards the future, whereas a negative number
     * pans towards the past.
     */
    panBy(x: number, animate?: boolean): void;
    /**
     * Pan to the specified time while keeping the current time range.
     *
     * @param time target time to reveal
     */
    panTo(time: number, animate?: boolean): void;
    /**
     * The time corresponding with the visible center.
     */
    get center(): number;
    set center(time: number);
    /**
     * Returns the drawables bound to this Timeline instance.
     */
    getChildren(): Drawable[];
    /**
     * Returns all Band instances bound to this Timeline instance.
     */
    getBands(): Band[];
    /**
     * Remove a drawable from this Timeline instance.
     *
     * @returns Whether an element was actually removed.
     */
    removeChild(drawable: Drawable): boolean;
    /**
     * Returns the x position in points for the given time
     * (relative to viewport)
     */
    positionTime(time: number): number;
    /**
     * Returns the time matching canvas x coordinate
     * (relative to full canvas)
     */
    timeForCanvasPosition(canvasX: number): number;
    /**
     * Returns pixel count between two times. The sign
     * is negative if time2 comes after time1.
     */
    distanceBetween(time1: number, time2: number): number;
    /**
     * Activate a built-in tool.
     */
    get tool(): Tool | undefined;
    set tool(tool: Tool | undefined);
    /**
     * Zooms in with a scale factor of 0.5 (half the current range).
     */
    zoomIn(): void;
    /**
     * Zooms out with a scale factor of 2 (twice the current range).
     */
    zoomOut(): void;
    /**
     * Zoom by a scale factor relative to the current range.
     * For example: 2 shows twice the current range, 0.5 shows
     * half the current range.
     *
     * @param relto time around which to center the zoom. If unspecified, the
     *              zoom is around the current centered time.
     */
    zoom(factor: number, animate?: boolean, relto?: number): void;
    get background(): FillStyle;
    set background(background: FillStyle);
    get foregroundColor(): string;
    set foregroundColor(foregroundColor: string);
    get fontFamily(): string;
    set fontFamily(fontFamily: string);
    get textSize(): number;
    set textSize(textSize: number);
    get bandBorderColor(): string;
    set bandBorderColor(bandBorderColor: string);
    get bandBorderWidth(): number;
    set bandBorderWidth(bandBorderWidth: number);
    private drawScreen;
    private drawOffscreen;
    private drawSelection;
    private drawFrozenTop;
}
