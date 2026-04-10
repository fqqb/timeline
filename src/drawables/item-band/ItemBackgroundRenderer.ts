import { Bounds } from '../../graphics/Bounds';
import { Graphics } from '../../graphics/Graphics';
import { Item } from './Item';
import { ItemBand } from './ItemBand';

export interface ItemBackgroundRenderer {
    /**
     * Draw the item's background within the given bounds
     */
    draw(g: Graphics, band: ItemBand, item: Item, bounds: Bounds, hovered: boolean): void;
}
