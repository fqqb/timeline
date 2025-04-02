import { AnnotatedItem } from './AnnotatedItem';
import { ItemBand } from './ItemBand';
import { ItemLayoutStrategy } from './ItemLayoutStrategy';

export class OnelineLayoutStrategy implements ItemLayoutStrategy {

    constructor(private itemBand: ItemBand) {
    }

    wrapItems(items: AnnotatedItem[]): AnnotatedItem[][] {
        return [items];
    }
}
