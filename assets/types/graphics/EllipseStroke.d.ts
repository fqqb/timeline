/**
 * Properties to be provided with {@link Graphics.strokeEllipse}.
 */
export interface EllipseStroke {
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
     * Stroke thickness.
     */
    lineWidth: number;
    /**
     * Stroke color.
     */
    color: string;
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
    /**
     * Dash pattern of the stroke.
     */
    dash?: number[];
}
