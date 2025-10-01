export interface LinePoint {

    /**
     * X-axis coordinate
     */
    x: number;

    /**
     * Y-axis coordinate
     */
    y: number | null;

    /**
     * Lowest value associated to this point
     */
    low?: number;

    /**
     * Highest value associated to this point
     */
    high?: number;
}
