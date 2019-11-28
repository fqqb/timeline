import { Timeline } from './Timeline';

export abstract class Band {

    protected lineHeight = 20;

    private _dividerColor: string;
    private _fontFamily: string;
    private _textSize: number;
    private _fixed = false;
    private _label?: string;

    private _height = this.lineHeight;

    constructor(protected timeline: Timeline, label?: string) {
        this._label = label;
        this._dividerColor = timeline.dividerColor;
        this._fontFamily = timeline.fontFamily;
        this._textSize = timeline.textSize;
    }

    get dividerColor() {
        return this._dividerColor;
    }

    set dividerColor(dividerColor: string) {
        this._dividerColor = dividerColor;
    }

    get fontFamily() {
        return this._fontFamily;
    }

    set fontFamily(fontFamily: string) {
        this._fontFamily = fontFamily;
    }

    get textSize() {
        return this._textSize;
    }

    set textSize(textSize: number) {
        this._textSize = textSize;
    }

    get label() {
        return this._label;
    }

    set label(label: string | undefined) {
        this._label = label;
    }

    get fixed() {
        return this._fixed;
    }

    set fixed(fixed: boolean) {
        this._fixed = fixed;
        this.timeline.repaint();
    }

    /**
     * Gets called from inside the render loop, but before anything is actually drawn.
     */
    calculateLayout() {
        this._height = this.lineHeight;
    }

    get height() {
        return this._height;
    }

    draw(canvas: HTMLCanvasElement, x: number, y: number) {
        const ctx = canvas.getContext('2d')!;

        // Bottom horizontal divider
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.dividerColor;
        const dividerY = y + this.height - 0.5;
        ctx.beginPath();
        ctx.moveTo(x, dividerY);
        ctx.lineTo(canvas.width, dividerY);
        ctx.stroke();
    }
}
