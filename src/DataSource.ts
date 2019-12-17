import { Timenav } from './Timenav';

export interface DataSource {

    connect(timenav: Timenav): void;

    disconnect(timenav: Timenav): void;
}
