import { Graphics } from '../graphics/Graphics';
import { Band } from './Band';
import { TextAlignment } from './TextAlignment';
/**
 * Displays a fixed-position text banner.
 */
export declare class Banner extends Band {
    private _contentHeight;
    private _text?;
    private _textAlignment;
    private _textColor;
    private _textSize;
    private _fontFamily;
    calculateContentHeight(g: Graphics): number;
    drawBandContent(g: Graphics): void;
    /**
     * The height of the band content (excluding margins).
     */
    get contentHeight(): number;
    set contentHeight(contentHeight: number);
    /**
     * Banner text.
     */
    get text(): string | undefined;
    set text(text: string | undefined);
    /**
     * Horizontal alignment of banner text.
     */
    get textAlignment(): TextAlignment;
    set textAlignment(textAlignment: TextAlignment);
    /**
     * Color of the banner text.
     */
    get textColor(): string;
    set textColor(textColor: string);
    /**
     * Size of the banner text.
     */
    get textSize(): number;
    set textSize(textSize: number);
    /**
     * Font family for banner text.
     */
    get fontFamily(): string;
    set fontFamily(fontFamily: string);
}
