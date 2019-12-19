import { Drawable } from './Drawable';
import { Timenav } from './Timenav';

export class TimeLocator extends Drawable {

    private _knobColor = 'red';
    private _knobRadius = 3;
    private _lineColor = 'red';
    private _lineWidth = 1;
    private _lineDash: number[] = [];

    constructor(timenav: Timenav, private timeProvider: () => number | undefined) {
        super(timenav);
    }

    drawOverlay(ctx: CanvasRenderingContext2D) {
        const t = this.timeProvider();
        if (t === undefined) {
            return;
        }

        const x = Math.round(this.timenav.positionTime(t));

        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = this.lineWidth;
        ctx.setLineDash(this.lineDash);
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, ctx.canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x + 0.5, 0, this.knobRadius, 0, 2 * Math.PI);
        ctx.fillStyle = this.knobColor;
        ctx.fill();
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
