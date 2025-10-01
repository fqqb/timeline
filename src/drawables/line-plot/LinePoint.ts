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

    /**
     * Radius of the point symbol.
     *
     * Defaults to the same property set at plot level
     */
    pointRadius?: number;


    /**
     * Color of the point symbol.
     *
     * Defaults to the same property set at plot level
     */
    pointColor?: string;
}
