import { FillStyle } from '../../graphics/FillStyle';

/**
 * Line-specific properties.
 *
 * Style attributes are optional. Values that are defined
 * here are prioritized over band attributes.
 */
export interface Line {

    /**
     * Color of this plot line.
     */
    lineColor?: string;

    /**
     * Thickness of this plot line.
     */
    lineWidth?: number;

    /**
     * Area fill for this line.
     */
    fill?: FillStyle;

    /**
     * Radius of the point symbol.
     */
    pointRadius?: number;

    /**
     * Radius of the point symbol when hovered.
     */
    pointHoverRadius?: number;

    /**
     * Color of the point symbol.
     */
    pointColor?: string;

    /**
     * Color of the low/area color.
     */
    lohiColor?: string;

    /**
     * Data points (time to value). The value null may be used
     * to indicate a gap. The value may also be an array of
     * [low, mid, high], where mid is the y value on the line plot.
     */
    points: Map<number, number | null> | Map<number, [number, number, number] | null>;

    /**
     * Arbitrary data associated with this line.
     */
    data?: any;
}
