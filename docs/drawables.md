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
band.label = 'Band';
band.events = [
    { start: 20, stop: 40, label: 'Event' },
    { start: 60, label: 'Milestone' },
];
```

{% include demo.html src="/timeline/examples/drawables-EventBand.html"
                     height="34px"
                     caption="EventBand" %}

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
                     height="20px"
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
                     height="20px"
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
                     height="20px"
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

const locator1 = new TimeLocator(timeline, () => 25);
locator1.lineColor = 'purple';
locator1.knobColor = 'purple';
const locator2 = new TimeLocator(timeline, () => 50);
locator2.lineColor = 'pink';
locator2.knobColor = 'pink';
const locator3 = new TimeLocator(timeline, () => 75);
locator3.lineColor = 'red';
locator3.knobColor = 'red';
```

{% include demo.html src="/timeline/examples/drawables-TimeLocator.html"
                     height="50px"
                     caption="TimeLocator" %}
