# timenav.js

Render events on an interactive timeline chart.


## Getting Started

```shell
npm install --save timenav
```

```html
<div id="timenav"></div>
```

```js
import { Timenav } from 'timenav';

var targetEl = document.getElementById('timenav');
var timenav = new Timenav(targetEl);

timenav.addAxis();
timenav.addLine();
timenav.addNowLocator();
```


## License

MIT
