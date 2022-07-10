import { FillStyle } from './FillStyle';

/**
 * Properties to be provided with {@link Graphics.fillEllipse}.
 */
export interface EllipseFill {
    /**
     * X-axis coordinate of the ellipse's center
     */
    cx: number;
    /**
     * Y-axis coordinate of the ellipse's center
     */
    cy: number;
    /**
     * The ellipse's X-radius.
     */
    rx: number;
    /**
     * The ellipse's Y-radius.
     */
    ry: number;
    /**
     * Fill the ellipse with a color, gradient or pattern.
     */
    fill: FillStyle;
    /**
     * Angle in radians at which the ellipse starts (measured clockwise from the positive x-axis).
     */
    startAngle?: number;
    /**
     * Angle in radians at which the ellipse ends (measured clockwise from the positive x-axis).
     */
    endAngle?: number;
    /**
     * If true, draw the ellipse anticlockwise.
     */
    anticlockwise?: boolean;
}
