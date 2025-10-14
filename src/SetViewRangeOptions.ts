export interface SetViewRangeOptions {

    /**
     * If true, animate the movement between the previous view range
     * and the new one.
     *
     * Default is true.
     */
    animate?: boolean;

    /**
     * If provided, this information is returned in the next
     * emitted ViewportChangeEvent.
     */
    source?: string;
}
