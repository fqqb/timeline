import { Graphics } from '../graphics/Graphics';
import { Path } from '../graphics/Path';
import { Point } from '../graphics/Point';
import { Drawable } from './Drawable';

/**
 * Draws a vertical bar at a specific time.
 */
export class TimeLocator extends Drawable {

    private _knobColor = 'red';
    private _knobRadius = 3;
    private _lineColor = 'red';
    private _lineWidth = 1;
    private _lineDash: number[] = [];
    private _time?: number;

    drawOverlay(g: Graphics) {
        if (this.time === undefined) {
            return;
        }

        const x = Math.round(this.timeline.positionTime(this.time));

        const top: Point = { x, y: 0 };
        const bottom: Point = { x, y: g.height };

        g.strokePath({
            color: this.lineColor,
            lineWidth: this.lineWidth,
            dash: this.lineDash,
            path: new Path(top.x + 0.5, top.y).lineTo(bottom.x + 0.5, bottom.y),
        });

        this.drawKnob(g, top, bottom);
    }

    /**
     * Draw the knob shape on the locator. The default behaviour is to
     * draw the bottom half of a circle.
     *
     * @param top top of the locator
     * @param bottom bottom of the locator
     */
    drawKnob(g: Graphics, top: Point, bottom: Point) {
        g.ctx.beginPath();
        g.ctx.arc(top.x + 0.5, top.y, this.knobRadius, 0, 2 * Math.PI);
        g.ctx.fillStyle = this.knobColor;
        g.ctx.fill();
    }

    /**
     * Time for this locator.
     */
    get time() { return this._time; }
    set time(time: undefined | number) {
        this._time = time;
        this.reportMutation();
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
     * An array of numbers describing a dash array. For
     * example: [4, 3] alternates between a line of 4 points
     * and a gap of 3. Set to [] to show a solid line.
     */
    get lineDash() { return this._lineDash; }
    set lineDash(lineDash: number[]) {
        this._lineDash = lineDash;
        this.reportMutation();
    }
}
