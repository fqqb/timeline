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

{% example drawables-TimeRuler-hours.html 30px %}

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

{% example drawables-TimeRuler-weekdays.html 30px %}

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

{% example drawables-TimeRuler-months.html 30px %}
