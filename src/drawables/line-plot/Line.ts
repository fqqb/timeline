import { FillStyle } from '../../graphics/FillStyle';
import { LinePoint } from './LinePoint';
import { LineStyle } from './LineStyle';

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
     * Line style (defaults to 'straight').
     */
    lineStyle?: LineStyle;

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
     * Color of the low/high area.
     */
    lohiColor?: string;

    /**
     * Data points (time to value). The value null may be used
     * to indicate a gap.
     */
    points: LinePoint[];

    /**
     * Whether this plot line is visible.
     *
     * If unset, defaults to true.
     */
    visible?: boolean;

    /**
     * Arbitrary data associated with this line.
     */
    data?: any;
}
