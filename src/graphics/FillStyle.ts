/**
 * Style to use when filling shapes.
 */
export type FillStyle =
    /**
     * CSS color string.
     */
    string |
    /**
     * Linear or radial gradient.
     */
    CanvasGradient |
    /**
     * Repeating image.
     */
    CanvasPattern;
