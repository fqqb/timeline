import { FillStyle } from '../graphics/FillStyle';
import { Drawable } from './Drawable';
/**
 * Sidebar where band headers are displayed.
 */
export declare abstract class Sidebar extends Drawable {
    private _width;
    private _background;
    private _clippedWidth;
    private _opened;
    /**
     * Pixel width of this sidebar.
     */
    get width(): number;
    set width(width: number);
    /**
     * Background style of the entire sidebar.
     */
    get background(): FillStyle;
    set background(background: FillStyle);
    /**
     * While a sidebar animation is underway (transitioning from open
     * to closed, or vice versa), this represents the current width
     * instead of the target width.
     */
    get clippedWidth(): number;
    /**
     * Close the sidebar if it is currently opened, else open it.
     */
    toggle(): void;
    /**
     * Open the sidebar.
     */
    open(): void;
    /**
     * Close the sidebar.
     */
    close(): void;
    /**
     * Returns whether the sidebar is currently opened.
     */
    get opened(): boolean;
}
