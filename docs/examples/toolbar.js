import { AbsoluteTimeAxis, EventLine, MouseTracker, TimeLocator, Timenav } from '/assets/timenav.js';

window.addEventListener('load', () => {
    const targetEl = document.getElementById('timenav');
    const timenav = new Timenav(targetEl);

    const axis = new AbsoluteTimeAxis(timenav);
    axis.frozen = true;

    const locator = new TimeLocator(timenav, () => new Date().getTime());
    locator.knobColor = 'salmon';
    locator.lineColor = 'salmon';

    const tracker = new MouseTracker(timenav);

    const start = luxon.DateTime.local().startOf('day');
    const stop = luxon.DateTime.local().endOf('day');
    timenav.setBounds(start.toMillis(), stop.toMillis());


    for (let i = 0; i < 30; i++) {
        const line = new EventLine(timenav);
        line.data = [
            {
                start: start.plus({ hours: 5 }).toMillis(),
                stop: start.plus({ hours: 10 }).toMillis(),
                title: 'A',
            },
        ]
        line.label = 'Line ' + (i + 1);
    }

    document.getElementById('hand').className = 'active';

    let moveInterval;

    window.toggleMove = (x) => {
        timenav.panBy(x);
        clearInterval(moveInterval);
        moveInterval = setInterval(() => timenav.panBy(x), 50);
    };

    window.untoggleMove = () => {
        clearInterval(moveInterval);
        moveInterval = undefined;
    };

    window.pageLeft = () => {
        const x = timenav.distanceBetween(timenav.start, timenav.stop);
        timenav.panBy(-x);
    };

    window.pageRight = () => {
        const x = timenav.distanceBetween(timenav.start, timenav.stop);
        timenav.panBy(x);
    };

    window.zoomIn = () => timenav.zoomIn();
    window.zoomOut = () => timenav.zoomOut();

    window.jumpToToday = () => {
        const dt = new Date();
        dt.setHours(0, 0, 0, 0);
        const start = dt.getTime();
        dt.setDate(dt.getDate() + 1);
        const stop = dt.getTime();
        timenav.setBounds(start, stop);
    };

    window.jumpToNow = () => timenav.panTo(new Date().getTime());

    window.toggleSidebar = () => timenav.sidebar.toggle();

    window.changeTool = tool => {
        timenav.setActiveTool(tool);
        for (const id of ['hand', 'range-select']) {
            document.getElementById(id).className = (tool === id ? 'active' : '');
        }
    };
});
