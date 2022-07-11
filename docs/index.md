---
layout: base
title: About @fqqb/timeline
---

**@fqqb/timeline** is a framework-agnostic JavaScript library for rendering interactive timeline charts such as this:

{% example mainpage.html %}


## Download

````
npm install --save @fqqb/timeline
````


## Usage

```html
<div id="timeline"></div>
<script type="module">
    import { Timeline } from 'https://esm.run/@fqqb/timeline';

    const targetEl = document.getElementById('timeline');
    const timeline = new Timeline(targetEl);
    // ...
</script>
```
