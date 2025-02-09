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
     * Color of the point symbol.
     */
    pointColor?: string;

    /**
     * Color of the low/area color.
     */
    lohiColor?: string;

    /**
     * Data points (time to value). The value null may be used
     * to indicate a gap.
     */
    points: Map<number, number | null>;

    /**
     * Low/high values by time. Timestamps should match the provided
     * points array.
     */
    lohi?: Map<number, [number, number] | null>;

    /**
     * Whether this plot line is visible.
     *
     * If unset, defaults to true.
     */
    visible?: boolean;
}
