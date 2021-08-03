import { Drawable } from './Drawable';
import { Graphics, Path } from './Graphics';
import { Timeline } from './Timeline';

export class TimeLocator extends Drawable {

    private _knobColor = 'red';
    private _knobRadius = 3;
    private _lineColor = 'red';
    private _lineWidth = 1;
    private _lineDash: number[] = [];

    /**
     * @param timeline Timeline instance that this drawable is bound to.
     * @param timeProvider Function that returns time for this locator (called upon each redraw).
     */
    constructor(timeline: Timeline, private timeProvider: () => number | undefined) {
        super(timeline);
    }

    /** @hidden */
    drawOverlay(g: Graphics) {
        const t = this.timeProvider();
        if (t === undefined) {
            return;
        }

        const x = Math.round(this.timeline.positionTime(t));

        g.strokePath({
            color: this.lineColor,
            lineWidth: this.lineWidth,
            dash: this.lineDash,
            path: new Path(x + 0.5, 0).lineTo(x + 0.5, g.canvas.height),
        });

        g.ctx.beginPath();
        g.ctx.arc(x + 0.5, 0, this.knobRadius, 0, 2 * Math.PI);
        g.ctx.fillStyle = this.knobColor;
        g.ctx.fill();
    }

    /**
     * Color of the top knob
     */
    get knobColor() { return this._knobColor; }
    set knobColor(knobColor: string) {
        this._knobColor = knobColor;
        this.reportMutation();
    }

    /**
     * Radius of the top knob
     */
    get knobRadius() { return this._knobRadius; }
    set knobRadius(knobRadius: number) {
        this._knobRadius = knobRadius;
        this.reportMutation();
    }

    /**
     * Color of this locator
     */
    get lineColor() { return this._lineColor; }
    set lineColor(lineColor: string) {
        this._lineColor = lineColor;
        this.reportMutation();
    }

    /**
     * Thickness of this locator
     */
    get lineWidth() { return this._lineWidth; }
    set lineWidth(lineWidth: number) {
        this._lineWidth = lineWidth;
        this.reportMutation();
    }

    /**
     * An array of numbers discribing a dash array. For
     * example: [4, 3] alternates between a line of 4 points
     * and a gap of 3. Set to [] to show a solid line.
     */
    get lineDash() { return this._lineDash; }
    set lineDash(lineDash: number[]) {
        this._lineDash = lineDash;
        this.reportMutation();
    }
}
