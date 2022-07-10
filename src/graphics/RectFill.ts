import { FillStyle } from './FillStyle';

/**
 * Properties to be provided with {@link Graphics.fillRect}.
 */
export interface RectFill {

    /**
     * X-axis coordinate of the rectangle's starting point.
     */
    x: number;

    /**
     * Y-axis coordinate of the rectangle's starting point.
     */
    y: number;

    /**
     * The rectangle's width.
     */
    width: number;

    /**
     * The rectangle's height.
     */
    height: number;

    /**
     * Fill the rectangle with a color, gradient or pattern.
     */
    fill: FillStyle;

    /**
     * Corner radius on the x-axis.
     */
    rx?: number;

    /**
     * Corner radius on the y-axis.
     */
    ry?: number;
}
