import { AnnotatedItem } from './AnnotatedItem';
import { ItemBand } from './ItemBand';
import { ItemLayoutStrategy } from './ItemLayoutStrategy';

/**
 * Places each item on a new line
 */
export class WaterfallLayoutStrategy implements ItemLayoutStrategy {
    constructor(private itemBand: ItemBand) {
    }

    wrapItems(items: AnnotatedItem[]): AnnotatedItem[][] {
        const lines: AnnotatedItem[][] = [];
        for (const item of items) {
            lines.push([item]);
        }
        return lines;
    }
}
