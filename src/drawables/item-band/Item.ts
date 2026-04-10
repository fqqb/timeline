import { FillStyle } from '../../graphics/FillStyle';
import { ItemBackgroundRenderer } from './ItemBackgroundRenderer';

/**
 * Item-specific properties.
 *
 * Style attributes are optional. Values that are defined
 * here are prioritized over band attributes.
 */
export interface Item {

    /**
     * Optional identifier. This may be used to identify items
     * in event callbacks, or when drawing connections.
     */
    id?: string | number;

    /**
     * Start time
     */
    start: number;

    /**
     * Stop time
     *
     * If unspecified the item is considered to be a milestone.
     */
    stop?: number;

    /**
     * Label of this item
     */
    label?: string;

    /**
     * Background style of this item
     */
    background?: FillStyle;

    /**
     * Background style of this item when it is hovered.
     */
    hoverBackground?: FillStyle;

    /**
     * Text color of this item
     */
    textColor?: string;

    /**
     * Text size in points of this item
     */
    textSize?: number;

    /**
     * Font family of this item
     */
    fontFamily?: string;

    /**
     * Border color for this item
     */
    borderColor?: string;

    /**
     * Border dash for this item. Provide an array of values that
     * specify alternating lengths of lines and gaps.
     */
    borderDash?: number[];

    /**
     * Thickness of the border for this item
     */
    borderWidth?: number;

    /**
     * Whitespace between the left border and the label
     */
    paddingLeft?: number;

    /**
     * Corner radius for this item.
     */
    cornerRadius?: number;

    /**
     * Custom renderer. If set, some other properties may be ignored,
     * because it becomes the renderer's job to draw background (border and
     * fill)
     */
    backgroundRenderer?: ItemBackgroundRenderer;

    /**
     * Arbitrary data associated with this item. For example
     * an identifier from a backend system.
     */
    data?: any;
}
