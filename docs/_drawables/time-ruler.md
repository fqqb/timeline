---
layout: base
title: TimeRuler
---

# TimeRuler

A band showing time scale indications.

The following examples force a specific scale. If no scale is specified, a scale is selected automatically based on the visible time range and available width.

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
