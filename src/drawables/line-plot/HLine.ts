
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
     * Font family of any value labels.
     *
     * Defaults to same font family as axis labels.
     */
    labelFontFamily?: string;

    /**
     * Size of any value labels.
     *
     * Defaults to same size as axis labels.
     */
    labelTextSize?: number;

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
