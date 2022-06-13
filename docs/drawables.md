---
layout: base
title: Drawables
permalink: /drawables/
order: 30
---

# Drawables

Drawables are bands or decorations that can be drawn on a Timeline instance.

## EventBand

A band showing events.

```javascript
const band = new EventBand(timeline);
band.label = 'Events';
band.events = [
    { start: 20, stop: 40, label: 'Event' },
    { start: 60, label: 'Milestone' },
];
```

{% include demo.html src="/timeline/examples/drawables-EventBand.html"
                     height="30px"
                     caption="EventBand" %}

## LinePlot

A band showing a line plot.

```javascript
const band = new LinePlot(timeline);
band.label = 'Plot';
band.fill = 'lime';

const points = new Map();
for (let i = 0; i < 100; i += 0.01) {
    points.set(i, Math.sin(i));
}

band.lines = [{
    points,
    pointRadius: 0,
}];
```
{% include demo.html src="/timeline/examples/drawables-LinePlot.html"
                     height="30px"
                     caption="LinePlot" %}


## Banner

```javascript
const band = new Banner(timeline);
band.label = 'Banner';
band.text = 'My banner';
```

A band showing a banner text.

{% include demo.html src="/timeline/examples/drawables-Banner.html"
                     height="30px"
                     caption="Banner" %}


## StateBand

```javascript
const band = new StateBand(timeline);
band.label = 'States';
band.states = [
    { time: -Infinity, label: 'A' },
    { time: 30, label: 'B' },
    { time: 40, label: 'C' },
    { time: 60, label: null }, // Gap
    { time: 80, label: 'D' },
];
```

A band showing state changes.

{% include demo.html src="/timeline/examples/drawables-StateBand.html"
                     height="30px"
                     caption="StateBand" %}

## TimeRuler

A band showing time scale indications. The following examples force a specific scale. If no scale is specified, a scale is selected automatically based on the visible time range and available width.

```javascript
const start = new Date();
start.setHours(0, 0, 0, 0);
const stop = new Date(start.getTime());
stop.setDate(stop.getDate() + 1);

timeline.setViewRange(start.getTime(), stop.getTime());

const band = new TimeRuler(timeline);
band.label = 'Time';
band.scale = 'hour';
```

{% include demo.html src="/timeline/examples/drawables-TimeRuler-hours.html"
                     height="30px"
                     caption="TimeRuler showing hours" %}

```javascript
const start = new Date();
start.setHours(0, 0, 0, 0);
const stop = new Date(start.getTime());
stop.setDate(stop.getDate() + 21);

timeline.setViewRange(start.getTime(), stop.getTime());

const band = new TimeRuler(timeline);
band.label = 'Time';
band.scale = 'weekDay';
```

{% include demo.html src="/timeline/examples/drawables-TimeRuler-weekdays.html"
                     height="30px"
                     caption="TimeRuler showing weekdays" %}

```javascript
const start = new Date();
start.setHours(0, 0, 0, 0);
const stop = new Date(start.getTime());
stop.setDate(stop.getDate() + 400);

timeline.setViewRange(start.getTime(), stop.getTime());

const band = new TimeRuler(timeline);
band.label = 'Time';
band.scale = 'month';
```

{% include demo.html src="/timeline/examples/drawables-TimeRuler-months.html"
                     height="30px"
                     caption="TimeRuler showing months" %}

## MouseTracker

Vertical guideline when hovering with mouse.

```javascript
timeline.sidebar = null;
new MouseTracker(timeline);
```

{% include demo.html src="/timeline/examples/drawables-MouseTracker.html"
                     height="50px"
                     caption="MouseTracker" %}


## TimeLocator

Vertical guideline indicating a specific time (here at 25%, 50%, and 75%). The function providing is time is called regularly, so can be used to feed a realtime source.

```javascript
timeline.sidebar = null;
timeline.setViewRange(0, 100);

const locator1 = new TimeLocator(timeline);
locator1.lineColor = 'purple';
locator1.knobColor = 'purple';
locator1.time = 25;
const locator2 = new TimeLocator(timeline);
locator2.lineColor = 'pink';
locator2.knobColor = 'pink';
locator2.time = 50;
const locator3 = new TimeLocator(timeline);
locator3.lineColor = 'red';
locator3.knobColor = 'red';
locator3.time = 75;
```

{% include demo.html src="/timeline/examples/drawables-TimeLocator.html"
                     height="50px"
                     caption="TimeLocator" %}
