import { Bounds } from '../../graphics/Bounds';
import { FillStyle } from '../../graphics/FillStyle';
import { Graphics } from '../../graphics/Graphics';
import { HitRegionSpecification } from '../../graphics/HitRegionSpecification';
import { Band } from '../Band';
import { TextOverflow } from '../TextOverflow';
import { Item } from './Item';
import { ItemClickEvent } from './ItemClickEvent';
import { ItemMouseEvent } from './ItemMouseEvent';
import { MilestoneShape } from './MilestoneShape';
import { drawCircle, drawDiamond, drawDot, drawReverseTriangle, drawTriangle } from './shapes';
import { ShapeStyle } from './ShapeStyle';


interface DrawInfo {
    label: string; // Actual text to be shown on an item (may include extra decoration: ◀)
    startX: number; // Left of bbox (item only, not label)
    stopX: number; // Right of bbox (item only, not label)
    renderStartX: number; // Left of bbox containing item and maybe outside label
    renderStopX: number; // Right of bbox containing item and maybe outside label
    offscreenStart: boolean; // True if the item starts before the visible range
    paddingLeft: number; // Padding specific to the item, or else inherited from its band
    labelFitsBox: boolean; // True if the label fits in the actual item box
    labelFitsVisibleBox: boolean; // True if the label fits in the visible box (excluding offscreen portion)
    font: string; // Font specific to the item, or else inherited from its band
    milestone: boolean; // True if this item must be rendered as a milestone
}

interface AnnotatedItem extends Item {
    region: HitRegionSpecification;
    hovered: boolean;
    drawInfo?: DrawInfo;
}

let itemSequence = 1;

/**
 * Band that draws events.
 */
export class ItemBand extends Band {

    private _itemBackground: FillStyle = '#77b1e1';
    private _itemBorderColor = '#000000';
    private _itemBorderDash: number[] = [];
    private _itemBorderWidth = 0;
    private _itemCornerRadius = 0;
    private _itemCursor = 'pointer';
    private _itemFontFamily = 'Verdana, Geneva, sans-serif';
    private _itemHeight = 30;
    private _itemHoverBackground: FillStyle = 'rgba(255, 255, 255, 0.2)';
    private _itemHoverBorderWidth: number = 0;
    private _itemPaddingLeft = 5;
    private _itemTextColor = '#333333';
    private _itemTextOverflow: TextOverflow = 'show';
    private _itemTextSize = 10;
    private _items: Item[] = [];
    private _lineSpacing = 0;
    private _spaceBetween = 0;
    private _multiline = true;
    private _milestoneShape: MilestoneShape = 'diamond';

    private itemsById = new Map<Item, string>();
    private annotatedItems: AnnotatedItem[] = [];
    private lines: AnnotatedItem[][] = [];

    private itemClickListeners: Array<(ev: ItemClickEvent) => void> = [];
    private itemMouseEnterListeners: Array<(ev: ItemMouseEvent) => void> = [];
    private itemMouseMoveListeners: Array<(ev: ItemMouseEvent) => void> = [];
    private itemMouseLeaveListeners: Array<(ev: ItemMouseEvent) => void> = [];

    /**
     * Register a listener that receives an update when an item is clicked.
     */
    addItemClickListener(listener: (ev: ItemClickEvent) => void) {
        this.itemClickListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * item click events.
     */
    removeItemClickListener(listener: (ev: ItemClickEvent) => void) {
        this.itemClickListeners = this.itemClickListeners.filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates whenever the mouse enters
     * an item.
     */
    addItemMouseEnterListener(listener: (ev: ItemMouseEvent) => void) {
        this.itemMouseEnterListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * item mouse-enter events.
     */
    removeItemMouseEnterListener(listener: (ev: ItemMouseEvent) => void) {
        this.itemMouseEnterListeners = this.itemMouseEnterListeners.filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving
     * over an item.
     */
    addItemMouseMoveListener(listener: (ev: ItemMouseEvent) => void) {
        this.itemMouseMoveListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * item mouse-move events.
     */
    removeItemMouseMoveListener(listener: (ev: ItemMouseEvent) => void) {
        this.itemMouseMoveListeners = this.itemMouseMoveListeners
            .filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving
     * outside an item.
     */
    addItemMouseLeaveListener(listener: (ev: ItemMouseEvent) => void) {
        this.itemMouseLeaveListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * item mouse-leave events.
     */
    removeItemMouseLeaveListener(listener: (ev: ItemMouseEvent) => void) {
        this.itemMouseLeaveListeners = this.itemMouseLeaveListeners
            .filter(el => (el !== listener));
    }

    // Link a long-term identifier with each item
    // TODO should make it customizable to have custom
    // equality check, instead of only by-reference.
    private processData() {
        this.annotatedItems.length = 0;
        for (const item of (this.items || [])) {
            let id = this.itemsById.get(item);
            if (id === undefined) {
                id = 'item_band_' + itemSequence++;
            }
            const annotatedItem: AnnotatedItem = {
                ...item,
                hovered: false,
                region: {
                    id,
                    parentId: this.bandRegionId,
                    cursor: this.itemCursor,
                    click: () => {
                        this.itemClickListeners.forEach(listener => listener({
                            item,
                        }));
                    },
                    mouseEnter: mouseEvent => {
                        annotatedItem.hovered = true;
                        this.reportMutation();
                        this.itemMouseEnterListeners.forEach(listener => listener({
                            clientX: mouseEvent.clientX,
                            clientY: mouseEvent.clientY,
                            item,
                        }));
                    },
                    mouseMove: mouseEvent => {
                        this.itemMouseMoveListeners.forEach(listener => listener({
                            clientX: mouseEvent.clientX,
                            clientY: mouseEvent.clientY,
                            item,
                        }));
                    },
                    mouseLeave: mouseEvent => {
                        annotatedItem.hovered = false;
                        this.reportMutation();
                        this.itemMouseLeaveListeners.forEach(listener => listener({
                            clientX: mouseEvent.clientX,
                            clientY: mouseEvent.clientY,
                            item,
                        }));
                    }
                },
            };

            this.annotatedItems.push(annotatedItem);
        }

        this.itemsById.clear();
        for (const item of this.annotatedItems) {
            this.itemsById.set(item, item.region.id);
        }
    }

    calculateContentHeight(g: Graphics) {
        this.measureItems(g);
        const visibleItems = this.annotatedItems.filter(item => !!item.drawInfo);
        this.lines = this.multiline ? this.wrapItems(visibleItems) : [visibleItems];

        let newHeight;
        if (this.lines.length > 1) {
            newHeight = this.itemHeight * this.lines.length;
            newHeight += this.lineSpacing * (this.lines.length - 1);
            return newHeight;
        } else {
            return this.itemHeight;
        }
    }

    drawBandContent(g: Graphics) {
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const offsetY = i * (this.lineSpacing + this.itemHeight);
            for (const item of line) {
                if (item.drawInfo!.milestone) {
                    this.drawMilestone(g, item, offsetY);
                } else {
                    this.drawItem(g, item, offsetY);
                }
            }
        }
    }

    private drawMilestone(g: Graphics, item: AnnotatedItem, y: number) {
        const {
            startX, renderStartX, renderStopX, label, font, paddingLeft
        } = item.drawInfo!;

        const bounds: Bounds = {
            x: startX,
            y,
            width: this.itemHeight,
            height: this.itemHeight,
        };

        const shapeStyle: ShapeStyle = {
            fill: item.background ?? this.itemBackground,
            borderWidth: item.borderWidth ?? this.itemBorderWidth,
            borderColor: item.borderColor ?? this.itemBorderColor,
            borderDash: item.borderDash ?? this.itemBorderDash,
        };

        this.drawMilestoneShape(g, bounds, shapeStyle);
        if (item.hovered) {
            const hoverBackground = item.hoverBackground ?? this.itemHoverBackground;
            const hoverStyle = { ...shapeStyle, fill: hoverBackground };
            this.drawMilestoneShape(g, bounds, hoverStyle);
        }

        // Hit region covers both the shape, and potential outside text
        const hitRegion = g.addHitRegion(item.region);
        hitRegion.addRect(renderStartX, y, renderStopX - renderStartX, this.itemHeight);

        if (label) {
            g.fillText({
                x: startX + bounds.width + paddingLeft,
                y: y + bounds.height / 2,
                text: label,
                font,
                baseline: 'middle',
                align: 'left',
                color: item.textColor ?? this.itemTextColor,
            });
        }
    }

    private drawMilestoneShape(g: Graphics, bounds: Bounds, style: ShapeStyle) {
        switch (this.milestoneShape) {
            case 'circle':
                drawCircle(g, bounds, style);
                break;
            case 'diamond':
                drawDiamond(g, bounds, style);
                break;
            case 'dot':
                drawDot(g, bounds, style);
                break;
            case 'reverse_triangle':
                drawReverseTriangle(g, bounds, style);
                break;
            case 'triangle':
                drawTriangle(g, bounds, style);
                break;
        }
    }

    private drawItem(g: Graphics, item: AnnotatedItem, y: number) {
        const {
            startX, stopX, label, renderStartX, renderStopX,
            paddingLeft, offscreenStart, labelFitsBox, labelFitsVisibleBox,
            font,
        } = item.drawInfo!;

        const box: Bounds = {
            x: Math.round(startX),
            y,
            width: Math.round(stopX - Math.round(startX)),
            height: this.itemHeight,
        };
        const r = item.cornerRadius ?? this.itemCornerRadius;
        g.fillRect({
            ...box,
            rx: r,
            ry: r,
            fill: item.background ?? this.itemBackground,
        });

        if (item.hovered) {
            g.fillRect({
                ...box,
                rx: r,
                ry: r,
                fill: item.hoverBackground ?? this.itemHoverBackground,
            });
        }

        // Hit region covers both the box, and potential outside text
        const hitRegion = g.addHitRegion(item.region);
        hitRegion.addRect(renderStartX, y, renderStopX - renderStartX, this.itemHeight);


        const borderWidth = item.borderWidth ?? this.itemBorderWidth;
        borderWidth && g.strokeRect({
            ...box,
            rx: r,
            ry: r,
            color: item.borderColor ?? this.itemBorderColor,
            lineWidth: borderWidth,
            dash: item.borderDash ?? this.itemBorderDash,
            crispen: true,
        });

        if (item.hovered && this.itemHoverBorderWidth) {
            g.strokeRect({
                ...box,
                rx: r,
                ry: r,
                color: item.borderColor ?? this.itemBorderColor,
                lineWidth: this.itemHoverBorderWidth,
                dash: item.borderDash ?? this.itemBorderDash,
                crispen: true,
            });
        }

        if (label) {
            let textX = box.x + paddingLeft;
            const textY = box.y + (box.height / 2);
            if (offscreenStart) {
                textX = this.timeline.positionTime(this.timeline.start);
            }
            if (labelFitsBox || labelFitsVisibleBox || this.itemTextOverflow === 'show') {
                g.fillText({
                    x: textX,
                    y: textY,
                    text: label,
                    font,
                    baseline: 'middle',
                    align: 'left',
                    color: item.textColor ?? this.itemTextColor,
                });
            } else if (this.itemTextOverflow === 'clip') {
                const tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = box.width;
                tmpCanvas.height = box.height;
                const offscreenCtx = tmpCanvas.getContext('2d')!;
                offscreenCtx.fillStyle = item.textColor ?? this.itemTextColor;
                offscreenCtx.font = font;
                offscreenCtx.textBaseline = 'middle';
                offscreenCtx.textAlign = 'left';
                offscreenCtx.fillText(label, paddingLeft, box.height / 2);
                g.ctx.drawImage(tmpCanvas, box.x, box.y);
            }
        }
    }

    private measureItems(g: Graphics) {
        for (const item of this.annotatedItems) {
            const milestone = !item.stop;
            const start = item.start;
            const stop = item.stop || item.start;
            if (start > this.timeline.stop || stop < this.timeline.start) {
                item.drawInfo = undefined; // Forget draw info from previous step
                continue;
            }

            let label = item.label || '';
            const textSize = item.textSize ?? this.itemTextSize;
            const fontFamily = item.fontFamily ?? this.itemFontFamily;
            const font = `${textSize}px ${fontFamily}`;
            const paddingLeft = item.paddingLeft ?? this.itemPaddingLeft;
            const offscreenStart = start < this.timeline.start && stop > this.timeline.start;
            let labelFitsBox;
            let labelFitsVisibleBox;

            let startX = this.timeline.positionTime(start);
            let stopX = this.timeline.positionTime(stop);

            let renderStartX;
            let renderStopX;

            if (milestone) {
                const shapeRadius = this.itemHeight / 2;
                startX -= shapeRadius;
                stopX += shapeRadius;

                renderStartX = startX;
                renderStopX = stopX;
                labelFitsBox = false;
                labelFitsVisibleBox = false;

                if (label && this.itemTextOverflow === 'show') {
                    const fm = g.measureText(label, font);
                    renderStopX += paddingLeft + fm.width;
                } else {
                    label = '';
                }
            } else {
                if (offscreenStart) {
                    label = '◀' + label;
                }
                const fm = g.measureText(label, font);

                if (offscreenStart) {
                    renderStartX = this.timeline.positionTime(this.timeline.start);
                    renderStopX = Math.max(renderStartX + fm.width, stopX);
                    labelFitsBox = false;
                    const availableLabelWidth = renderStopX - renderStartX - paddingLeft;
                    labelFitsVisibleBox = availableLabelWidth >= fm.width;
                } else {
                    renderStartX = startX;
                    renderStopX = stopX;
                    const availableLabelWidth = renderStopX - renderStartX - paddingLeft;
                    labelFitsBox = availableLabelWidth >= fm.width;
                    labelFitsVisibleBox = labelFitsBox;
                    if (!labelFitsBox) {
                        if (this.itemTextOverflow === 'show') {
                            renderStopX = renderStartX + paddingLeft + fm.width;
                        } else if (this.itemTextOverflow === 'hide') {
                            label = '';
                        }
                    }
                }
            }

            item.drawInfo = {
                font,
                paddingLeft,
                offscreenStart,
                startX,
                stopX,
                renderStartX,
                renderStopX,
                label,
                labelFitsBox,
                labelFitsVisibleBox,
                milestone,
            };
        }
    }

    private wrapItems(items: AnnotatedItem[]) {
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
                    if ((renderStopX + this.spaceBetween) <= midStartX) {
                        max = mid - 1; // Put cursor before mid
                    } else if (renderStartX >= (midStopX + this.spaceBetween)) {
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

    /**
     * List of items to be drawn on this band.
     *
     * An item is allowed to fall outside of the visible
     * time range, and in fact this can be used
     * to preload data prior to an anticipated pan
     * operation.
     */
    get items() { return this._items; }
    set items(items: Item[]) {
        this._items = items;
        this.processData();
        this.reportMutation();
    }

    /**
     * Height in points of items belonging to this band.
     */
    get itemHeight() { return this._itemHeight; }
    set itemHeight(itemHeight: number) {
        this._itemHeight = itemHeight;
        this.reportMutation();
    }

    /**
     * Default background color of items belonging to this
     * band.
     */
    get itemBackground() { return this._itemBackground; }
    set itemBackground(itemBackground: FillStyle) {
        this._itemBackground = itemBackground;
        this.reportMutation();
    }

    /**
     * Default text color of items belonging to this band.
     */
    get itemTextColor() { return this._itemTextColor; }
    set itemTextColor(itemTextColor: string) {
        this._itemTextColor = itemTextColor;
        this.reportMutation();
    }

    /**
     * Default text size of items belonging to this band.
     */
    get itemTextSize() { return this._itemTextSize; }
    set itemTextSize(itemTextSize: number) {
        this._itemTextSize = itemTextSize;
        this.reportMutation();
    }

    /**
     * Default font family of items belonging to this band.
     */
    get itemFontFamily() { return this._itemFontFamily; }
    set itemFontFamily(itemFontFamily: string) {
        this._itemFontFamily = itemFontFamily;
        this.reportMutation();
    }

    /**
     * Default border thickness of items belonging to this
     * band.
     */
    get itemBorderWidth() { return this._itemBorderWidth; }
    set itemBorderWidth(itemBorderWidth: number) {
        this._itemBorderWidth = itemBorderWidth;
        this.reportMutation();
    }

    /**
     * Default border color of items belonging to this band.
     */
    get itemBorderColor() { return this._itemBorderColor; }
    set itemBorderColor(itemBorderColor: string) {
        this._itemBorderColor = itemBorderColor;
        this.reportMutation();
    }

    /**
     * Default border dash of items belong to this band.
     *
     * Provide an array of values that specify alternating lengths
     * of lines and gaps.
     */
    get itemBorderDash() { return this._itemBorderDash; }
    set itemBorderDash(itemBorderDash: number[]) {
        this._itemBorderDash = itemBorderDash;
        this.reportMutation();
    }

    /**
     * Whitespace between the left border of an item, and
     * its label.
     */
    get itemPaddingLeft() { return this._itemPaddingLeft; }
    set itemPaddingLeft(itemPaddingLeft: number) {
        this._itemPaddingLeft = itemPaddingLeft;
        this.reportMutation();
    }

    /**
     * Default corner radius of items belonging to this band.
     */
    get itemCornerRadius() { return this._itemCornerRadius; }
    set itemCornerRadius(itemCornerRadius: number) {
        this._itemCornerRadius = itemCornerRadius;
        this.reportMutation();
    }

    /**
     * True if items belonging to this band should wrap over
     * multiple lines when otherwise they would overlap.
     */
    get multiline() { return this._multiline; }
    set multiline(multiline: boolean) {
        this._multiline = multiline;
        this.reportMutation();
    }

    /**
     * In case of multiline, this allows reserving
     * some extra whitespace that has to be present, or else
     * an item is considered to overlap.
     */
    get spaceBetween() { return this._spaceBetween; }
    set spaceBetween(spaceBetween: number) {
        this._spaceBetween = spaceBetween;
        this.reportMutation();
    }

    /**
     * In case of multiline, this specifies the
     * whitespace between lines.
     */
    get lineSpacing() { return this._lineSpacing; }
    set lineSpacing(lineSpacing: number) {
        this._lineSpacing = lineSpacing;
        this.reportMutation();
    }

    /**
     * Indicates what must happen with an item label in case
     * its width would exceed that of the item box.
     */
    get itemTextOverflow() { return this._itemTextOverflow; }
    set itemTextOverflow(itemTextOverflow: TextOverflow) {
        this._itemTextOverflow = itemTextOverflow;
        this.reportMutation();
    }

    /**
     * Cursor when mouse hovers an item.
     */
    get itemCursor() { return this._itemCursor; }
    set itemCursor(itemCursor: string) {
        this._itemCursor = itemCursor;
        this.reportMutation();
    }

    /**
     * Item background when hovering.
     *
     * This is drawn on top of the actual item background.
     */
    get itemHoverBackground() { return this._itemHoverBackground; }
    set itemHoverBackground(itemHoverBackground: FillStyle) {
        this._itemHoverBackground = itemHoverBackground;
        this.reportMutation();
    }

    /**
     * Item border width when hovering.
     *
     * This is drawn on top of the actual item border (if any).
     */
    get itemHoverBorderWidth() { return this._itemHoverBorderWidth; }
    set itemHoverBorderWidth(itemHoverBorderWidth: number) {
        this._itemHoverBorderWidth = itemHoverBorderWidth;
        this.reportMutation();
    }

    /**
     * In case the item is a milestone (when it has no stop time),
     * this is the shape drawn for it.
     */
    get milestoneShape() { return this._milestoneShape; }
    set milestoneShape(milestoneShape: MilestoneShape) {
        this._milestoneShape = milestoneShape;
        this.reportMutation();
    }
}
