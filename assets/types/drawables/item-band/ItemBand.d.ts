import { FillStyle } from '../../graphics/FillStyle';
import { Graphics } from '../../graphics/Graphics';
import { Band } from '../Band';
import { TextOverflow } from '../TextOverflow';
import { Item } from './Item';
import { ItemClickEvent } from './ItemClickEvent';
import { ItemMouseEvent } from './ItemMouseEvent';
import { MilestoneShape } from './MilestoneShape';
/**
 * Band that draws events.
 */
export declare class ItemBand extends Band {
    private _itemBackground;
    private _itemBorderColor;
    private _itemBorderDash;
    private _itemBorderWidth;
    private _itemCornerRadius;
    private _itemCursor;
    private _itemFontFamily;
    private _itemHeight;
    private _itemHoverBackground;
    private _itemMarginLeft;
    private _itemTextColor;
    private _itemTextOverflow;
    private _itemTextSize;
    private _items;
    private _lineSpacing;
    private _spaceBetween;
    private _multiline;
    private _milestoneShape;
    private itemsById;
    private annotatedItems;
    private lines;
    private itemClickListeners;
    private itemMouseEnterListeners;
    private itemMouseMoveListeners;
    private itemMouseLeaveListeners;
    /**
     * Register a listener that receives an update when an item is clicked.
     */
    addItemClickListener(listener: (ev: ItemClickEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * item click events.
     */
    removeItemClickListener(listener: (ev: ItemClickEvent) => void): void;
    /**
     * Register a listener that receives updates whenever the mouse enters
     * an item.
     */
    addItemMouseEnterListener(listener: (ev: ItemMouseEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * item mouse-enter events.
     */
    removeItemMouseEnterListener(listener: (ev: ItemMouseEvent) => void): void;
    /**
     * Register a listener that receives updates whenever the mouse is moving
     * over an item.
     */
    addItemMouseMoveListener(listener: (ev: ItemMouseEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * item mouse-move events.
     */
    removeItemMouseMoveListener(listener: (ev: ItemMouseEvent) => void): void;
    /**
     * Register a listener that receives updates whenever the mouse is moving
     * outside an item.
     */
    addItemMouseLeaveListener(listener: (ev: ItemMouseEvent) => void): void;
    /**
     * Unregister a previously registered listener to stop receiving
     * item mouse-leave events.
     */
    removeItemMouseLeaveListener(listener: (ev: ItemMouseEvent) => void): void;
    private processData;
    calculateContentHeight(g: Graphics): number;
    drawBandContent(g: Graphics): void;
    private drawMilestone;
    private drawMilestoneShape;
    private drawItem;
    private measureItems;
    private wrapItems;
    /**
     * List of items to be drawn on this band.
     *
     * An item is allowed to fall outside of the visible
     * time range, and in fact this can be used
     * to preload data prior to an anticipated pan
     * operation.
     */
    get items(): Item[];
    set items(items: Item[]);
    /**
     * Height in points of items belonging to this band.
     */
    get itemHeight(): number;
    set itemHeight(itemHeight: number);
    /**
     * Default background color of items belonging to this
     * band.
     */
    get itemBackground(): FillStyle;
    set itemBackground(itemBackground: FillStyle);
    /**
     * Default text color of items belonging to this band.
     */
    get itemTextColor(): string;
    set itemTextColor(itemTextColor: string);
    /**
     * Default text size of items belonging to this band.
     */
    get itemTextSize(): number;
    set itemTextSize(itemTextSize: number);
    /**
     * Default font family of items belonging to this band.
     */
    get itemFontFamily(): string;
    set itemFontFamily(itemFontFamily: string);
    /**
     * Default border thickness of items belonging to this
     * band.
     */
    get itemBorderWidth(): number;
    set itemBorderWidth(itemBorderWidth: number);
    /**
     * Default border color of items belonging to this band.
     */
    get itemBorderColor(): string;
    set itemBorderColor(itemBorderColor: string);
    /**
     * Default border dash of items belong to this band.
     *
     * Provide an array of values that specify alternating lengths
     * of lines and gaps.
     */
    get itemBorderDash(): number[];
    set itemBorderDash(itemBorderDash: number[]);
    /**
     * Whitespace between the left border of an item, and
     * its label.
     */
    get itemMarginLeft(): number;
    set itemMarginLeft(itemMarginLeft: number);
    /**
     * Default corner radius of items belonging to this band.
     */
    get itemCornerRadius(): number;
    set itemCornerRadius(itemCornerRadius: number);
    /**
     * True if items belonging to this band should wrap over
     * multiple lines when otherwise they would overlap.
     */
    get multiline(): boolean;
    set multiline(multiline: boolean);
    /**
     * In case of ``multiline=true``, this allows reserving
     * some extra whitespace that has to be present, or else
     * an item is considered to overlap.
     */
    get spaceBetween(): number;
    set spaceBetween(spaceBetween: number);
    /**
     * In case of ``multiline=true``, this specifies the
     * whitespace between lines.
     */
    get lineSpacing(): number;
    set lineSpacing(lineSpacing: number);
    /**
     * Indicates what must happen with an item label in case
     * its width would exceed that of the item box.
     */
    get itemTextOverflow(): TextOverflow;
    set itemTextOverflow(itemTextOverflow: TextOverflow);
    /**
     * Cursor when mouse hovers an item.
     */
    get itemCursor(): string;
    set itemCursor(itemCursor: string);
    /**
     * Item background when hovering.
     *
     * This is drawn on top of the actual item background.
     */
    get itemHoverBackground(): FillStyle;
    set itemHoverBackground(itemHoverBackground: FillStyle);
    /**
     * In case the item is a milestone (when it has no stop time),
     * this is the shape drawn for it.
     */
    get milestoneShape(): MilestoneShape;
    set milestoneShape(milestoneShape: MilestoneShape);
}
