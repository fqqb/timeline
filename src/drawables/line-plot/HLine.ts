import { FillStyle } from '../../graphics/FillStyle';

/**
 * Fixed-value horizontal line
 */
export interface HLine {

    /**
     * Value of this line.
     */
    value: number;

    /**
     * Color of this plot line.
     */
    lineColor: string;

    /**
     * Thickness of this plot line.
     */
    lineWidth?: number;

    /**
     * Dash pattern of the line
     */
    lineDash?: number[];

    /**
     * Optionally, label this line.
     */
    label?: string;

    /**
     * Background color of tick labels.
     */
    labelBackground?: FillStyle;

    /**
     * Text color of this label.
     */
    labelTextColor?: string;

    /**
     * If true, the Y-axis range is extended to ensure
     * the value represented by this HLine is visible.
     *
     * This property is only considered during autoscaling
     * of the axis.
     *
     * Defaults to true.
     */
    extendAxisRange?: boolean;
}
