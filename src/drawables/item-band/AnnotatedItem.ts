import { HitRegionSpecification } from '../../graphics/HitRegionSpecification';
import { DrawInfo } from './DrawInfo';
import { Item } from './Item';

export class AnnotatedItem {
    // Note: designed to be pass-trough to userItem,
    // so that properties could be updated on-the-fly
    // using Item extension classes (with getters).

    constructor(
        readonly userItem: Item,
        public hovered: boolean,
        public region: HitRegionSpecification,
        public drawInfo?: DrawInfo) {
    }

    get id() {
        return this.userItem.id;
    }

    get start() {
        return this.userItem.start;
    }

    get stop() {
        return this.userItem.stop;
    }

    get label() {
        return this.userItem.label;
    }

    get background() {
        return this.userItem.background;
    }

    get hoverBackground() {
        return this.userItem.hoverBackground;
    }

    get borderWidth() {
        return this.userItem.borderWidth;
    }

    get borderColor() {
        return this.userItem.borderColor;
    }

    get borderDash() {
        return this.userItem.borderDash;
    }

    get textBaseline() {
        return this.userItem.textBaseline;
    }

    get textBackground() {
        return this.userItem.textBackground;
    }

    get textColor() {
        return this.userItem.textColor;
    }

    get textSize() {
        return this.userItem.textSize;
    }

    get fontFamily() {
        return this.userItem.fontFamily;
    }

    get cornerRadius() {
        return this.userItem.cornerRadius;
    }

    get paddingLeft() {
        return this.userItem.paddingLeft;
    }

    get backgroundRenderer() {
        return this.userItem.backgroundRenderer;
    }

    get data() {
        return this.userItem.data;
    }
}
