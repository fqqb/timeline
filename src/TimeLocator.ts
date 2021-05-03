import { Drawable } from './Drawable';
import { Graphics, Path } from './Graphics';
import { Timeline } from './Timeline';

export class TimeLocator extends Drawable {

    private _knobColor = 'red';
    private _knobRadius = 3;
    private _lineColor = 'red';
    private _lineWidth = 1;
    private _lineDash: number[] = [];

    constructor(timeline: Timeline, private timeProvider: () => number | undefined) {
        super(timeline);
    }

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

    get knobColor() { return this._knobColor; }
    set knobColor(knobColor: string) {
        this._knobColor = knobColor;
        this.reportMutation();
    }

    get knobRadius() { return this._knobRadius; }
    set knobRadius(knobRadius: number) {
        this._knobRadius = knobRadius;
        this.reportMutation();
    }

    get lineColor() { return this._lineColor; }
    set lineColor(lineColor: string) {
        this._lineColor = lineColor;
        this.reportMutation();
    }

    get lineWidth() { return this._lineWidth; }
    set lineWidth(lineWidth: number) {
        this._lineWidth = lineWidth;
        this.reportMutation();
    }

    get lineDash() { return this._lineDash; }
    set lineDash(lineDash: number[]) {
        this._lineDash = lineDash;
        this.reportMutation();
    }
}
