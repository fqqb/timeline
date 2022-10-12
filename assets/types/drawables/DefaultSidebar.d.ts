import { Graphics } from '../graphics/Graphics';
import { Sidebar } from './Sidebar';
/**
 * Default sidebar implementation.
 */
export declare class DefaultSidebar extends Sidebar {
    private _dividerColor;
    private _foregroundColor;
    private _fontFamily;
    private _textSize;
    private _overlayColor;
    private _hoverOverlayColor;
    private hoveredIndex?;
    drawContent(g: Graphics): void;
    private drawOffscreen;
    private drawBand;
    get foregroundColor(): string;
    set foregroundColor(foregroundColor: string);
    /**
     * Color of the right border that separates
     * the sidebar from the timeline content.
     */
    get dividerColor(): string;
    set dividerColor(dividerColor: string);
    get fontFamily(): string;
    set fontFamily(fontFamily: string);
    get textSize(): number;
    set textSize(textSize: number);
    /**
     * Color used to cover the background. This covers also the borders so
     * generally you want to add some level of transparency.
     */
    get overlayColor(): string;
    set overlayColor(overlayColor: string);
    /**
     * Color overlayed on top of the hovered label.
     */
    get hoverOverlayColor(): string;
    set hoverOverlayColor(hoverOverlayColor: string);
}
