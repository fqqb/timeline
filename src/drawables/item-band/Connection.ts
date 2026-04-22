export interface Connection {

    /**
     * Identifier of the item where the connection starts
     */
    from: string | number;

    /**
     * Identifier of the item where the connection ends
     */
    to: string | number;

    /**
     * This connection's line color
     */
    lineColor?: string;

    /**
     * Thickness of this connection's line
     */
    lineWidth?: number;

    /**
     * Radius of this connection's start
     */
    startRadius?: number;

    /**
     * Radius of this connection's end
     */
    endRadius?: number;

    /**
     * Inner color of this connection's start
     */
    startInnerColor?: string;

    /**
     * Inner color of this connection's end
     */
    endInnerColor?: string;

    /**
     * Outer color of this connection's start
     */
    startOuterColor?: string;

    /**
     * Outer color of this connection's end
     */
    endOuterColor?: string;
}
