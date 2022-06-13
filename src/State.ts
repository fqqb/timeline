import { FillStyle } from './Graphics';

/**
 * State-specific properties.
 *
 * Style attributes are optional. Values that are defined
 * here are prioritized over band attributes.
 */
export interface State {

    /**
     * Start time
     */
    time: number;

    /**
     * State value, or null if the previous state is no longer valid.
     */
    label: string | null;

    /**
     * Background style of this state
     */
    background?: FillStyle;

    /**
     * Background style of this state when it is hovered.
     */
    hoverBackground?: FillStyle;

    /**
     * Text color of this state
     */
    textColor?: string;

    /**
     * Text size in points of this event
     */
    textSize?: number;

    /**
     * Font family of this event
     */
    fontFamily?: string;

    /**
     * Arbitrary data associated with this event. For example
     * an identifier of a backend system.
     */
    data?: any;
}
