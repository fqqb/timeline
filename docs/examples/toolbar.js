import { AbsoluteTimeAxis, EventLine, MouseTracker, Timeline, TimeLocator } from '/assets/timeline.js';

window.addEventListener('load', () => {
    const targetEl = document.getElementById('timeline');
    const timeline = new Timeline(targetEl);

    const axis = new AbsoluteTimeAxis(timeline);
    axis.frozen = true;

    const locator = new TimeLocator(timeline, () => new Date().getTime());
    locator.knobColor = 'salmon';
    locator.lineColor = 'salmon';

    const tracker = new MouseTracker(timeline);

    const start = luxon.DateTime.local().startOf('day');
    const stop = luxon.DateTime.local().endOf('day');
    timeline.setBounds(start.toMillis(), stop.toMillis());


    for (let i = 0; i < 10; i++) {
        const line = new EventLine(timeline);
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
        timeline.panBy(x);
        clearInterval(moveInterval);
        moveInterval = setInterval(() => timeline.panBy(x), 50);
    };

    window.untoggleMove = () => {
        clearInterval(moveInterval);
        moveInterval = undefined;
    };

    window.pageLeft = () => {
        const x = timeline.distanceBetween(timeline.start, timeline.stop);
        timeline.panBy(-x);
    };

    window.pageRight = () => {
        const x = timeline.distanceBetween(timeline.start, timeline.stop);
        timeline.panBy(x);
    };

    window.zoomIn = () => timeline.zoomIn();
    window.zoomOut = () => timeline.zoomOut();

    window.jumpToToday = () => {
        const dt = new Date();
        dt.setHours(0, 0, 0, 0);
        const start = dt.getTime();
        dt.setDate(dt.getDate() + 1);
        const stop = dt.getTime();
        timeline.setBounds(start, stop);
    };

    window.jumpToNow = () => timeline.panTo(new Date().getTime());

    window.toggleSidebar = () => timeline.sidebar.toggle();

    window.changeTool = tool => {
        timeline.setActiveTool(tool);
        for (const id of ['hand', 'range-select']) {
            document.getElementById(id).className = (tool === id ? 'active' : '');
        }
    };
});
