/**
 * Properties to be provided with {@link Graphics.strokeRect}.
 */
export interface RectStroke {
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
     * Stroke color.
     */
    color: string;

    /**
     * Corner radius on the x-axis.
     */
    rx?: number;

    /**
     * Corner radius on the y-axis.
     */
    ry?: number;

    /**
     * Stroke thickness.
     */
    lineWidth?: number;

    lineJoin?: CanvasLineJoin;

    /**
     * Dash pattern of the stroke.
     */
    dash?: number[];

    crispen?: boolean;
}
