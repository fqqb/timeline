import { ConnectionType } from './ConnectionType';

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
     * What type of connection
     */
    type: ConnectionType;

    /**
     * This connection's line color
     */
    lineColor?: string;

    /**
     * Thickness of this connection's line
     */
    lineWidth?: number;
}
