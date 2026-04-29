export interface DrawInfo {
    label: string; // Actual text to be shown on an item (may include extra decoration: ◀)
    startX: number; // Left of bbox (item only, not label)
    stopX: number; // Right of bbox (item only, not label)
    realStopX: number; // Right of bbox (item only, not label), prior to applying itemMinWidth
    renderStartX: number; // Left of bbox containing item and maybe outside label
    renderStopX: number; // Right of bbox containing item and maybe outside label
    renderStart: number; // Time at left of bbox
    renderStop: number; // Time at right of bbox (incl. outside label)
    offscreenStart: boolean; // True if the item starts before the visible range
    paddingLeft: number; // Padding specific to the item, or else inherited from its band
    labelFitsBox: boolean; // True if the label fits in the actual item box
    labelFitsVisibleBox: boolean; // True if the label fits in the visible box (excluding offscreen portion)
    font: string; // Font specific to the item, or else inherited from its band
    milestone: boolean; // True if this item must be rendered as a milestone
}
