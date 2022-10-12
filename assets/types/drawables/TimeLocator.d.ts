import { Graphics } from '../graphics/Graphics';
import { Point } from '../graphics/Point';
import { Drawable } from './Drawable';
/**
 * Draws a vertical bar at a specific time.
 */
export declare class TimeLocator extends Drawable {
    private _knobColor;
    private _knobRadius;
    private _lineColor;
    private _lineWidth;
    private _lineDash;
    private _time?;
    drawOverlay(g: Graphics): void;
    /**
     * Draw the knob shape on the locator. The default behaviour is to
     * draw the bottom half of a circle.
     *
     * @param top top of the locator
     * @param bottom bottom of the locator
     */
    drawKnob(g: Graphics, top: Point, bottom: Point): void;
    /**
     * Time for this locator.
     */
    get time(): undefined | number;
    set time(time: undefined | number);
    /**
     * Color of the top knob
     */
    get knobColor(): string;
    set knobColor(knobColor: string);
    /**
     * Radius of the top knob
     */
    get knobRadius(): number;
    set knobRadius(knobRadius: number);
    /**
     * Color of this locator
     */
    get lineColor(): string;
    set lineColor(lineColor: string);
    /**
     * Thickness of this locator
     */
    get lineWidth(): number;
    set lineWidth(lineWidth: number);
    /**
     * An array of numbers describing a dash array. For
     * example: [4, 3] alternates between a line of 4 points
     * and a gap of 3. Set to [] to show a solid line.
     */
    get lineDash(): number[];
    set lineDash(lineDash: number[]);
}
