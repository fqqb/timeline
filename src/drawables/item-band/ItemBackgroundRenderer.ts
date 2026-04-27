import { Bounds } from '../../graphics/Bounds';
import { Graphics } from '../../graphics/Graphics';
import { AnnotatedItem } from './AnnotatedItem';
import { ItemBand } from './ItemBand';

export interface ItemBackgroundRenderer {
    /**
     * Draw the item's background within the given bounds
     */
    draw(g: Graphics, band: ItemBand, item: AnnotatedItem, bounds: Bounds, hovered: boolean): void;
}
