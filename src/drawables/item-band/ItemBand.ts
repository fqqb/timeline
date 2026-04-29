import { Bounds } from '../../graphics/Bounds';
import { FillStyle } from '../../graphics/FillStyle';
import { Graphics } from '../../graphics/Graphics';
import { Band } from '../Band';
import { TextBaseline } from '../TextBaseline';
import { TextOverflow } from '../TextOverflow';
import { AnnotatedItem } from './AnnotatedItem';
import { ClusterLayoutStrategy } from './ClusterLayoutStrategy';
import { Connection } from './Connection';
import { ConnectionRenderer } from './ConnectionRenderer';
import { DefaultConnectionRenderer } from './DefaultConnectionRenderer';
import { DefaultItemBackgroundRenderer } from './DefaultItemBackgroundRenderer';
import { Item } from './Item';
import { ItemBackgroundRenderer } from './ItemBackgroundRenderer';
import { ItemClickEvent } from './ItemClickEvent';
import { ItemMouseEvent } from './ItemMouseEvent';
import { MilestoneShape } from './MilestoneShape';
import { MultilineLayoutStrategy } from './MultilineLayoutStrategy';
import { OnelineLayoutStrategy } from './OnelineLayoutStrategy';
import { drawCircle, drawDiamond, drawDot, drawReverseTriangle, drawTriangle } from './shapes';
import { ShapeStyle } from './ShapeStyle';
import { WaterfallLayoutStrategy } from './WaterfallLayoutStrategy';

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
    private _itemTextBaseline: TextBaseline = 'middle';
    private _itemTextColor = '#333333';
    private _itemTextOverflow: TextOverflow = 'show';
    private _itemTextSize = 10;
    private _itemTextBackground?: FillStyle;
    private _itemMinWidth = 3;
    private _items: Item[] = [];
    private _connectionLineColor = '#000000';
    private _connectionStartRadius = 6;
    private _connectionEndRadius = 6;
    private _connectionStartInnerColor = '#000000';
    private _connectionEndInnerColor = '#000000';
    private _connectionStartOuterColor?: string;
    private _connectionEndOuterColor?: string;
    private _connectionLineWidth = 1;
    private _connectionJointRadius = 0;
    private _connections: Connection[] = [];
    private _lineSpacing = 0;
    private _spaceBetween = 0;
    private _multiline = true;
    private _waterfall = false;
    private _milestoneShape: MilestoneShape = 'diamond';

    private _itemBackgroundRenderer: ItemBackgroundRenderer = new DefaultItemBackgroundRenderer();
    private _connectionRenderer: ConnectionRenderer = new DefaultConnectionRenderer();

    private _onelineLayoutStrategy = new OnelineLayoutStrategy(this);
    private _multilineLayoutStrategy = new MultilineLayoutStrategy(this);
    private _clusterLayoutStrategy = new ClusterLayoutStrategy(this);
    private _waterfallLayoutStrategy = new WaterfallLayoutStrategy(this);

    private idByItem = new Map<Item, string>();
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
        for (const userItem of (this.items || [])) {
            let id = this.idByItem.get(userItem);
            if (id === undefined) {
                id = 'item_band_' + itemSequence++;
            }
            const annotatedItem = new AnnotatedItem(
                userItem,
                false,
                {
                    id,
                    parentId: this.bandRegion.id,
                    cursor: this.itemCursor,
                    click: () => {
                        this.itemClickListeners.forEach(listener => listener({
                            item: userItem,
                        }));
                    },
                    mouseEnter: mouseEvent => {
                        annotatedItem.hovered = true;
                        this.reportMutation();
                        this.itemMouseEnterListeners.forEach(listener => listener({
                            clientX: mouseEvent.clientX,
                            clientY: mouseEvent.clientY,
                            item: userItem,
                        }));
                    },
                    mouseMove: mouseEvent => {
                        this.itemMouseMoveListeners.forEach(listener => listener({
                            clientX: mouseEvent.clientX,
                            clientY: mouseEvent.clientY,
                            item: userItem,
                        }));
                    },
                    mouseLeave: mouseEvent => {
                        annotatedItem.hovered = false;
                        this.reportMutation();
                        this.itemMouseLeaveListeners.forEach(listener => listener({
                            clientX: mouseEvent.clientX,
                            clientY: mouseEvent.clientY,
                            item: userItem,
                        }));
                    }
                });

            this.annotatedItems.push(annotatedItem);
        }

        this.idByItem.clear();
        for (const annotatedItem of this.annotatedItems) {
            const { userItem } = annotatedItem;
            this.idByItem.set(userItem, annotatedItem.region.id);
        }
    }

    override calculateContentHeight(g: Graphics) {
        this.measureItems(g);
        const visibleItems = this.annotatedItems.filter(item => !!item.drawInfo);

        if (this.multiline) {
            if (this.waterfall) {
                this.lines = this._waterfallLayoutStrategy.wrapItems(visibleItems);
            } else if (this.connections.length) {
                this.lines = this._clusterLayoutStrategy.wrapItems(visibleItems);
            } else {
                this.lines = this._multilineLayoutStrategy.wrapItems(visibleItems);
            }
        } else {
            this.lines = this._onelineLayoutStrategy.wrapItems(visibleItems);
        }

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

        if (this.multiline) {
            this.connectionRenderer.beforeConnectionDraw(this, this.lines);
            for (const connection of this.connections) {
                this.connectionRenderer.draw(g, this, connection);
            }
        }

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const offsetY = i * (this.lineSpacing + this.itemHeight);
            for (const item of line) {
                if (item.drawInfo!.milestone) {

                } else {
                    this.drawItemOverlay(g, item, offsetY);
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
        const { startX, stopX, renderStartX, renderStopX } = item.drawInfo!;
        const bounds: Bounds = {
            x: Math.round(startX),
            y,
            width: Math.round(stopX - Math.round(startX)),
            height: this.itemHeight,
        };

        const backgroundRenderer = item.backgroundRenderer ?? this.itemBackgroundRenderer;
        backgroundRenderer.draw(g, this, item, bounds, item.hovered);

        // Hit region covers both the box, and potential outside text
        const hitRegion = g.addHitRegion(item.region);
        hitRegion.addRect(renderStartX, y, renderStopX - renderStartX, this.itemHeight);
    }

    protected drawItemOverlay(g: Graphics, item: AnnotatedItem, y: number) {
        const {
            startX, stopX, label, paddingLeft, offscreenStart, labelFitsBox,
            labelFitsVisibleBox, font, renderStopX,
        } = item.drawInfo!;

        const box: Bounds = {
            x: Math.round(startX),
            y,
            width: Math.round(stopX - Math.round(startX)),
            height: this.itemHeight,
        };

        if (label) {
            let textX = box.x + paddingLeft;
            if (offscreenStart) {
                textX = this.timeline.positionTime(this.timeline.start);
            }

            let textY = box.y + (box.height / 2);
            let textBaseline: 'top' | 'middle' | 'bottom' = 'middle';
            const itemTextBaseline = item.textBaseline ?? this.itemTextBaseline;
            if (itemTextBaseline === 'top') {
                textY = box.y;
                textBaseline = 'top';
            } else if (itemTextBaseline === 'bottom') {
                textY = box.y + box.height;
                textBaseline = 'bottom';
            }

            if (labelFitsBox || labelFitsVisibleBox || this.itemTextOverflow === 'show') {
                const textBackground = item.textBackground ?? this.itemTextBackground;
                if (textBackground) {
                    const fm = g.measureText(label, font);
                    let y = textY - (fm.height / 2); // Middle of item
                    if (textBaseline === 'top') {
                        y = textY; // Top of item
                    } else if (textBaseline === 'bottom') {
                        y = textY - fm.height; // Bottom of item
                    }
                    g.fillRect({
                        x: textX,
                        y,
                        fill: textBackground,
                        width: fm.width,
                        height: fm.height,
                    });
                }
                g.fillText({
                    x: textX,
                    y: textY,
                    text: label,
                    font,
                    baseline: textBaseline,
                    align: 'left',
                    color: item.textColor ?? this.itemTextColor,
                });
            } else if (this.itemTextOverflow === 'clip') {
                if (box.x > 0 && box.y > 0) {
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
    }

    private measureItems(g: Graphics) {
        for (const item of this.annotatedItems) {
            const milestone = !item.stop;
            const start = item.start;
            let stop = item.stop || item.start;
            if (start > this.timeline.stop || stop < this.timeline.start) {
                item.drawInfo = undefined; // Forget draw info from previous step
                continue;
            }

            let startX = this.timeline.positionTime(start);
            let stopX = this.timeline.positionTime(stop);
            let realStopX = stopX;
            if ((stopX - startX) < this.itemMinWidth) {
                stopX = startX + this.itemMinWidth;
                stop = this.timeline.timeForPosition(stopX);
            }

            let label = item.label || '';
            const textSize = item.textSize ?? this.itemTextSize;
            const fontFamily = item.fontFamily ?? this.itemFontFamily;
            const font = `${textSize}px ${fontFamily}`;
            const paddingLeft = item.paddingLeft ?? this.itemPaddingLeft;
            const offscreenStart = startX + paddingLeft < 0 && stop > this.timeline.start;
            let labelFitsBox;
            let labelFitsVisibleBox;

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
                realStopX,
                renderStartX,
                renderStopX,
                renderStart: start,
                renderStop: this.timeline.timeForPosition(renderStopX),
                label,
                labelFitsBox,
                labelFitsVisibleBox,
                milestone,
            };
        }
    }

    /**
     * List of items to be drawn on this band.
     *
     * An item is allowed to fall outside of the visible
     * time range. This can be used to preload data prior
     * to an anticipated pan operation.
     */
    get items() { return this._items; }
    set items(items: Item[]) {
        this._items = items;
        this.processData();
        this.reportMutation();
    }

    /**
     * List of connections to be drawn on this band.
     */
    get connections() { return this._connections; }
    set connections(connections: Connection[]) {
        this._connections = connections;
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
     * Item background renderer. The default renderer considers
     * background, border and hover properties.
     *
     * By setting a custom renderer you can change how the back
     * ground and border are rendered. This is the actual item
     * box (excluding. any labels).
     */
    get itemBackgroundRenderer() { return this._itemBackgroundRenderer; }
    set itemBackgroundRenderer(itemBackgroundRenderer: ItemBackgroundRenderer) {
        this._itemBackgroundRenderer = itemBackgroundRenderer;
        this.reportMutation();
    }

    /**
     * Connection renderer
     */
    get connectionRenderer() { return this._connectionRenderer; }
    set connectionRenderer(connectionRenderer: ConnectionRenderer) {
        this._connectionRenderer = connectionRenderer;
        this.reportMutation();
    }

    /**
     * Default text baseline of items belonging to this band.
     */
    get itemTextBaseline() { return this._itemTextBaseline; }
    set itemTextBaseline(itemTextBaseline: TextBaseline) {
        this._itemTextBaseline = itemTextBaseline;
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
     * Default text background of items belonging to this band.
     */
    get itemTextBackground() { return this._itemTextBackground; }
    set itemTextBackground(itemTextBackground: FillStyle | undefined) {
        this._itemTextBackground = itemTextBackground;
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
     * Color of the connection line
     */
    get connectionLineColor() { return this._connectionLineColor; }
    set connectionLineColor(connectionLineColor: string) {
        this._connectionLineColor = connectionLineColor;
        this.reportMutation();
    }

    /**
     * Radius of connection's start
     */
    get connectionStartRadius() { return this._connectionStartRadius; }
    set connectionStartRadius(connectionStartRadius: number) {
        this._connectionStartRadius = connectionStartRadius;
        this.reportMutation();
    }

    /**
     * Radius of connection's end
     */
    get connectionEndRadius() { return this._connectionEndRadius; }
    set connectionEndRadius(connectionEndRadius: number) {
        this._connectionEndRadius = connectionEndRadius;
        this.reportMutation();
    }

    /**
     * Inner color of connection's start
     */
    get connectionStartInnerColor() { return this._connectionStartInnerColor; }
    set connectionStartInnerColor(connectionStartInnerColor: string) {
        this._connectionStartInnerColor = connectionStartInnerColor;
        this.reportMutation();
    }

    /**
     * Inner color of connection's end
     */
    get connectionEndInnerColor() { return this._connectionEndInnerColor; }
    set connectionEndInnerColor(connectionEndInnerColor: string) {
        this._connectionEndInnerColor = connectionEndInnerColor;
        this.reportMutation();
    }

    /**
     * Outer color of connection's start.
     *
     * If undefined, follows the item's background color.
     */
    get connectionStartOuterColor() { return this._connectionStartOuterColor; }
    set connectionStartOuterColor(connectionStartOuterColor: string | undefined) {
        this._connectionStartOuterColor = connectionStartOuterColor;
        this.reportMutation();
    }

    /**
     * Outer color of connection's end.
     *
     * If undefined, follows the item's background color.
     */
    get connectionEndOuterColor() { return this._connectionEndOuterColor; }
    set connectionEndOuterColor(connectionEndOuterColor: string | undefined) {
        this._connectionEndOuterColor = connectionEndOuterColor;
        this.reportMutation();
    }

    /**
     * Thickness of connection line
     */
    get connectionLineWidth() { return this._connectionLineWidth; }
    set connectionLineWidth(connectionLineWidth: number) {
        this._connectionLineWidth = connectionLineWidth;
        this.reportMutation();
    }

    /**
     * Corner radius at the joints of connections
     */
    get connectionJointRadius() { return this._connectionJointRadius; }
    set connectionJointRadius(connectionJointRadius: number) {
        this._connectionJointRadius = connectionJointRadius;
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
     * In case of multiline, this allows specifying whether
     * items should appear all on different lines (= waterfall),
     * or if items may be combined on the same line when space
     * permits.
     */
    get waterfall() { return this._waterfall; }
    set waterfall(waterfall: boolean) {
        this._waterfall = waterfall;
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

    /**
     * If an item is less wide than this value, expand it
     * to this size.
     *
     * This avoids displaying item boxes that are almost
     * invisible.
     */
    get itemMinWidth() { return this._itemMinWidth; }
    set itemMinWidth(itemMinWidth: number) {
        this._itemMinWidth = itemMinWidth;
        this.reportMutation();
    }
}
