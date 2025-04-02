import { AnnotatedItem } from './AnnotatedItem';
import { ItemBand } from './ItemBand';
import { ItemLayoutStrategy } from './ItemLayoutStrategy';

export class MultilineLayoutStrategy implements ItemLayoutStrategy {

    constructor(private itemBand: ItemBand) {
    }

    wrapItems(items: AnnotatedItem[]) {
        const spaceBetween = this.itemBand.spaceBetween;

        const lines: AnnotatedItem[][] = [];
        for (const item of items) {
            const { renderStartX, renderStopX } = item.drawInfo!;
            let inserted = false;
            for (const line of lines) {
                let min = 0;
                let max = line.length - 1;
                while (min <= max) {
                    const mid = Math.floor((min + max) / 2);
                    const midStartX = line[mid].drawInfo!.renderStartX;
                    const midStopX = line[mid].drawInfo!.renderStopX;
                    if ((renderStopX + spaceBetween) <= midStartX) {
                        max = mid - 1; // Put cursor before mid
                    } else if (renderStartX >= (midStopX + spaceBetween)) {
                        min = mid + 1; // Put cursor after mid
                    } else {
                        break; // Overlap
                    }
                }
                if (min > max) {
                    line.splice(min, 0, item);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                lines.push([item]); // A new line
            }
        }
        return lines;
    }
}
