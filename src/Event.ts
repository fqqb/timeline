/**
 * Event-specific properties.
 *
 * Style attributes are optional. Values that are defined
 * here are priotized over band attributes.
 */
export interface Event {

    /**
     * Start time
     */
    start: number;

    /**
     * Stop time
     *
     * If unspecified the event is considered to be a milestone.
     */
    stop?: number;

    /**
     * Label of this event
     */
    label?: string;

    /**
     * Background color of this event
     */
    color?: string;

    /**
     * Text color of this event
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
     * Border color for this event
     */
    borderColor?: string;

    /**
     * Border dash for this event. Provide an array of values that
     * specify alternating lengths of lines and gaps.
     */
    borderDash?: number[];

    /**
     * Thickness of the border for this event
     */
    borderWidth?: number;

    /**
     * Whitespace between the left border and the label
     */
    marginLeft?: number;

    /**
     * Corner radius for this event.
     */
    cornerRadius?: number;

    /**
     * Arbitrary data associated with this event. For example
     * an identifier of a backend system.
     */
    data?: any;
}
