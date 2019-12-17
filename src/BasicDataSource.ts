import { DataSource } from './DataSource';
import { Timenav } from './Timenav';

export type TimenavData = { [key: string]: any; };

/**
 * A basic data source that provides a static collection of data indexed by id.
 *
 * For more advanced used cases like fetching remote data, implement your own DataSource.
 */
export class BasicDataSource implements DataSource {

    private _data: TimenavData;
    private timenav?: Timenav;

    constructor(initialData: TimenavData) {
        this._data = initialData;
    }

    connect(timenav: Timenav) {
        this.timenav = timenav;
        this.updateTimenav();
    }

    get data() { return this._data; }
    set data(data: TimenavData) {
        this._data = data;
        this.updateTimenav();
    }

    private updateTimenav() {
        if (this.timenav) {
            for (const line of this.timenav.getLines()) {
                /*
                if (line.id in this._data) {
                    line.data = this._data[line.id];
                } else {
                    line.data = undefined;
                }*/
            }
        }
    }

    disconnect() {
        this.timenav = undefined;
    }
}
