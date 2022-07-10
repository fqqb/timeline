---
layout: base
title: TimeLocator
---

# TimeLocator

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

{% example drawables-TimeLocator.html 50px %}
