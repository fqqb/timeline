/**
 * Properties to be provided with {@link Graphics.fillText}.
 */
export interface TextFill {

    /**
     * X-axis coordinate at which to begin drawing text.
     */
    x: number;

    /**
     * Y-axis coordinate at which to begin drawing text.
     */
    y: number;

    /**
     * Text baseline when drawing text.
     */
    baseline: 'top' | 'middle' | 'bottom';

    /**
     * Text alignment when drawing text.
     */
    align: 'left' | 'right' | 'center';

    /**
     * CSS font string.
     */
    font: string;

    /**
     * Text color.
     */
    color: string;

    /**
     * Text to draw.
     */
    text: string;
}
