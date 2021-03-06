# renderToMarkup

> This method should only be used on the server.

Renders all cached styles grouped CSS strings and returns a valid HTML markup with `<style>` elements. The elements are grouped and sorted in the following order:

1. Fonts
2. Static Styles
3. Keyframes
4. Rules
5. Support Rules
6. Media Query Rules
7. Support & Media Query Rules

The DOM renderer is able to rehydrate its cache from the markup in order to skip initial rendering.

## Arguments
| Argument | Type | Description |
| --- | --- | --- |
| renderer | [*Renderer*](../fela/Renderer.md) | The renderer providing the styles which are rendered to stringified HTML markup. |

### Returns
(*string*): Single concatenated HTML markup string containing required `<style>` elements.

### Example
```javascript
import { renderToMarkup } from 'fela-dom'
import { createRenderer } from 'fela'

const renderer = createRenderer()

const rule = ({ fontSize }) => ({
  fontSize: fontSize,
  color: 'blue',
  '@supports (display: flex)': {
    color: 'green'
  },
  '@media (min-width: 300px)': {
    color: 'red'
  }
})

renderer.renderStatic('html,body{box-sizing:border-box;margin:0}').
renderer.renderRule(rule, { fontSize: '12px' })

const markup = renderToMarkup(renderer)

```
The following markup would be returned:

```HTML
<style type="text/css" data-fela-type="STATIC" data-fela-rehydration="4">html,body{box-sizing:border-box;margin:0}</style>
<style type="text/css" data-fela-type="RULE" data-fela-rehydration="4">.a{font-size:12px}.b{color:blue}</style>
<style type="text/css" data-fela-type="RULE" data-fela-rehydration="4" data-fela-support>.c{color:green}</style>
<style type="text/css" data-fela-type="RULE" data-fela-rehydration="4" media="(min-width: 300px)">.d{color:red}</style>
```

### Using `renderer.rendererId`

If you decided to use the [`renderer.rendererId` option](../fela/Renderer.md) you should ensure that your server and
client renderers have the same ids.

#### Server code

```javascript
import { createRenderer } from 'fela'
import { renderToMarkup } from 'fela-dom'

const serverRenderer = createRenderer({
  rendererId: 'OTHER'
})
    
const markup = renderToMarkup(serverRenderer)
```

#### Client code

```javascript
import { createRenderer } from 'fela'
import { rehydrate } from 'fela-dom'

const clientRenderer = createRenderer({
  rendererId: 'OTHER'
})
    
rehydrate(clientRenderer)
```
