import { Graphics } from '../../graphics/Graphics';
import { AnnotatedItem } from './AnnotatedItem';
import { Connection } from './Connection';
import { ItemBand } from './ItemBand';

export interface ConnectionRenderer {

    /**
     * Called during the draw of the band content, but before any connections
     * are to be drawn.
     */
    beforeConnectionDraw(band: ItemBand, lines: AnnotatedItem[][]): void;

    /**
     * Draw a specific connection
     */
    draw(g: Graphics, band: ItemBand, connection: Connection): void;
}
