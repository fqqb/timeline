This is a tiny, fast and memory-efficient JavaScript library for rendering interactive scrollable event timelines.

IMAGE


## Key Features

* Zero dependencies.
* Customizable looks.
* Works with or without remote data.
* Out of the box tools: hand, zoom, select, range selection.
* Support continuous or fixed range event data.
* Drag events on a magnetic field.
* Many hooks for integration with your preferred UI framework.
* Extensible with custom band types and decorations.


## Getting Started

```shell
npm install --save @fqqb/timeline
```

```html
<div id="timeline"></div>
```

```js
import { Timeline } from '@fqqb/timeline';

var targetEl = document.getElementById('timeline');
var timeline = new Timeline(targetEl);

timeline.addTimescale();
timeline.addNowLocator();
```


## Examples

* A static example without interactions.
* An interactive example with custom controls.
* An example that adds custom band types.
* An example with lazy loading of events.


## Reference

### Concepts

**Event**

**Band**

**Decoration**

**Locator**



## License

MIT
