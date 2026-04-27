import { Bounds } from '../../graphics/Bounds';
import { Graphics } from '../../graphics/Graphics';
import { AnnotatedItem } from './AnnotatedItem';
import { Item } from './Item';
import { ItemBackgroundRenderer } from './ItemBackgroundRenderer';
import { ItemBand } from './ItemBand';

/**
 * Default item background renderer.
 *
 * Draws (in order):
 * - background fill
 * - background hover fill (if hovered)
 * - border stroke
 * - border hover stroke (if hovered)
 *
 * Hover effects apply on top of the non-hover fill/stroke.
 */
export class DefaultItemBackgroundRenderer implements ItemBackgroundRenderer {
    draw(g: Graphics, band: ItemBand, item: AnnotatedItem, bounds: Bounds, hovered: boolean): void {
        this.drawBackground(g, band, item, bounds, hovered);
        this.drawBorder(g, band, item, bounds, hovered);
    }

    /**
     * Draw a background fill, and (if hovered) a hovered fill on top.
     */
    drawBackground(g: Graphics, band: ItemBand, item: Item, bounds: Bounds, hovered: boolean): void {
        const r = item.cornerRadius ?? band.itemCornerRadius;
        g.fillRect({
            ...bounds,
            rx: r,
            ry: r,
            fill: item.background ?? band.itemBackground,
        });

        if (hovered) {
            g.fillRect({
                ...bounds,
                rx: r,
                ry: r,
                fill: item.hoverBackground ?? band.itemHoverBackground,
            });
        }
    }

    /**
     * Draw a border stroke, and (if hovered) a hovered stroke on top.
     */
    drawBorder(g: Graphics, band: ItemBand, item: Item, bounds: Bounds, hovered: boolean): void {
        const r = item.cornerRadius ?? band.itemCornerRadius;
        const borderWidth = item.borderWidth ?? band.itemBorderWidth;
        borderWidth && g.strokeRect({
            ...bounds,
            rx: r,
            ry: r,
            color: item.borderColor ?? band.itemBorderColor,
            lineWidth: borderWidth,
            dash: item.borderDash ?? band.itemBorderDash,
            crispen: true,
        });

        if (hovered && band.itemHoverBorderWidth) {
            g.strokeRect({
                ...bounds,
                rx: r,
                ry: r,
                color: item.borderColor ?? band.itemBorderColor,
                lineWidth: band.itemHoverBorderWidth,
                dash: item.borderDash ?? band.itemBorderDash,
                crispen: true,
            });
        }
    }
}
