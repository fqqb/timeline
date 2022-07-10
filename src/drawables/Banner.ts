import { Graphics } from '../graphics/Graphics';
import { Band } from './Band';
import { TextAlignment } from './TextAlignment';

/**
 * Displays a fixed-position text banner.
 */
export class Banner extends Band {

    private _contentHeight = 30;
    private _text?: string;
    private _textAlignment: TextAlignment = 'middle';
    private _textColor = '#333333';
    private _textSize = 16;
    private _fontFamily = 'Verdana, Geneva, sans-serif';

    calculateContentHeight(g: Graphics) {
        return this._contentHeight;
    }

    drawBandContent(g: Graphics) {
        if (!this.text) {
            return;
        }

        const style = {
            color: this.textColor,
            font: `${this.textSize}px ${this.fontFamily}`,
            text: this.text,
        };

        if (this.textAlignment === 'left') {
            g.fillText({
                ...style,
                x: 0,
                y: this.contentHeight / 2,
                align: 'left',
                baseline: 'middle',
            });
        } else if (this.textAlignment === 'middle') {
            g.fillText({
                ...style,
                x: this.timeline.mainWidth / 2,
                y: this.contentHeight / 2,
                align: 'center',
                baseline: 'middle',
            });
        } else {
            g.fillText({
                ...style,
                x: this.timeline.mainWidth,
                y: this.contentHeight / 2,
                align: 'right',
                baseline: 'middle',
            });
        }
    }

    /**
     * The height of the band content (excluding margins).
     */
    get contentHeight() { return this._contentHeight; }
    set contentHeight(contentHeight: number) {
        this._contentHeight = contentHeight;
        this.reportMutation();
    }

    /**
     * Banner text.
     */
    get text() { return this._text; }
    set text(text: string | undefined) {
        this._text = text;
        this.reportMutation();
    }

    /**
     * Horizontal alignment of banner text.
     */
    get textAlignment() { return this._textAlignment; }
    set textAlignment(textAlignment: TextAlignment) {
        this._textAlignment = textAlignment;
        this.reportMutation();
    }

    /**
     * Color of the banner text.
     */
    get textColor() { return this._textColor; }
    set textColor(textColor: string) {
        this._textColor = textColor;
        this.reportMutation();
    }

    /**
     * Size of the banner text.
     */
    get textSize() { return this._textSize; }
    set textSize(textSize: number) {
        this._textSize = textSize;
        this.reportMutation();
    }

    /**
     * Font family for banner text.
     */
    get fontFamily() { return this._fontFamily; }
    set fontFamily(fontFamily: string) {
        this._fontFamily = fontFamily;
        this.reportMutation();
    }
}
