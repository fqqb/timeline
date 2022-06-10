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
     * Color of the fill for this line.
     */
    fillColor?: string;

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
     * Data points (time to value).
     */
    points: Map<number, number | null>;
}
