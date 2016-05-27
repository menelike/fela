import StyleSheet from '../../../modules/renderers/dom/StyleSheet'
import MediaSelector from '../../../modules/components/dom/MediaSelector'
import Selector from '../../../modules/components/shared/Selector'
import FontFace from '../../../modules/components/dom/FontFace'
import Keyframe from '../../../modules/components/dom/Keyframe'

describe('StyleSheet Tests', () => {
  describe('Adding a Selector variation', () => {
    it('should add a cache entry', () => {
      const selector = new Selector(props => ({ color: 'red' }))
      const sheet = new StyleSheet()

      sheet._renderSelectorVariation(selector)

      expect(sheet.cache.has(selector)).to.eql(true)
    })

    it('should add a media cache entry for each media', () => {
      const selector = new MediaSelector(props => ({ color: 'red' }), {
        screen: props => ({ color: 'blue' }),
        'min-height: 300px': props => ({
          color: 'yellow'
        })
      })

      const sheet = new StyleSheet()

      sheet._renderSelectorVariation(selector)

      expect(sheet.mediaCache.has('screen')).to.eql(true)
      expect(sheet.mediaCache.has('min-height: 300px')).to.eql(true)
      expect(sheet.mediaCache.get('screen').has(selector)).to.eql(true)
      expect(sheet.mediaCache.get('min-height: 300px').has(selector)).to.eql(true)
    })

    it('should reuse cached variations', () => {
      const selector = new Selector(props => ({ color: 'red' }))
      const sheet = new StyleSheet()

      sheet._renderSelectorVariation(selector, { color: 'red' })
      sheet._renderSelectorVariation(selector, { color: 'red' })
      sheet._renderSelectorVariation(selector, { color: 'blue' })

      expect(sheet.cache.get(selector).size).to.eql(3)
    })

    it('should generate an incrementing reference id', () => {
      const selector = new Selector(props => ({ color: 'red' }))
      const selector2 = new Selector(props => ({ color: 'blue' }))
      const sheet = new StyleSheet()

      sheet._renderSelectorVariation(selector)
      sheet._renderSelectorVariation(selector2)

      expect(sheet.ids.has(selector)).to.eql(true)
      expect(sheet.ids.has(selector2)).to.eql(true)
      expect(sheet.ids.get(selector2)).to.be.greaterThan(sheet.ids.get(selector))
    })

    it('should always return the same className prefix', () => {
      const selector = new Selector(props => ({ color: 'red' }))
      const sheet = new StyleSheet()

      const staticClassName = sheet._renderSelectorVariation(selector)
      const dynamicClassName = sheet._renderSelectorVariation(selector, {
        foo: 'bar'
      })
      expect(staticClassName).to.not.eql(dynamicClassName)
      expect(staticClassName.substr(0, 2)).to.eql(dynamicClassName.substr(0, 2))
    })

    it('should support function selectors', () => {
      const selector = props => ({ color: 'red' })
      const sheet = new StyleSheet()

      sheet._renderSelectorVariation(selector)

      expect(sheet.cache.has(selector)).to.eql(true)
      expect(sheet.cache.get(selector).get('s')).to.eql({
        '': {
          color: 'red'
        }
      })
    })
  })

  describe('Adding a Keyframe variation', () => {
    it('should add a cache entry', () => {
      const keyframe = new Keyframe(props => ({
        from: {
          color: 'red'
        },
        to: {
          color: 'blue'
        }
      }))
      const sheet = new StyleSheet()

      sheet._renderKeyframeVariation(keyframe)

      expect(sheet.keyframes.has(keyframe)).to.eql(true)
    })

    it('should return a valid animation name', () => {
      const keyframe = new Keyframe(props => ({
        from: {
          color: 'red'
        },
        to: {
          color: 'blue'
        }
      }))
      const sheet = new StyleSheet()

      const animationName = sheet._renderKeyframeVariation(keyframe)

      expect(animationName).to.eql('k0')
    })

    it('should render dynamic keyframe variations', () => {
      const keyframe = new Keyframe(props => ({
        from: {
          color: props.color
        },
        to: {
          color: 'blue'
        }
      }))
      const sheet = new StyleSheet()

      const animationName = sheet._renderKeyframeVariation(keyframe, {
        color: 'red'
      })

      expect(animationName).to.eql('k0--aedinm')
      expect(sheet.keyframes.get(keyframe).get('-aedinm')).to.eql({
        from: {
          color: 'red'
        },
        to: {
          color: 'blue'
        }
      })
    })

    it('should process keyframes with plugins', () => {
      const keyframe = new Keyframe(props => ({
        from: {
          color: 'red'
        },
        to: {
          color: 'blue'
        }
      }))
      const sheet = new StyleSheet()

      const animationName = sheet._renderKeyframeVariation(keyframe, {}, [ ({ styles }) => ({
        ...styles,
        from: {
          ...styles.from,
          foo: 'bar'
        }
      }) ])

      expect(sheet.keyframes.get(keyframe).get('s')).to.eql({
        from: {
          color: 'red',
          foo: 'bar'
        },
        to: {
          color: 'blue'
        }
      })
    })
  })

  describe('Generating the props reference', () => {
    it('should always return the same className with the same props', () => {
      const stylesheet = new StyleSheet()

      const className1 = stylesheet._generatePropsReference('foobar')
      const className2 = stylesheet._generatePropsReference('foobar')
      expect(className1).to.eql(className2)
    })

    it('should sort props before', () => {
      const stylesheet = new StyleSheet()

      const className1 = stylesheet._generatePropsReference({
        foo: 'bar',
        fontSize: 12
      })
      const className2 = stylesheet._generatePropsReference({
        fontSize: 12,
        foo: 'bar'
      })
      expect(className1).to.eql(className2)
    })

    it('should use a `s` for selectors base', () => {
      const stylesheet = new StyleSheet()

      const className1 = stylesheet._generatePropsReference()
      const className2 = stylesheet._generatePropsReference({ })
      expect(className1).to.eql('s')
      expect(className2).to.eql('s')
    })
  })

  describe('Rendering a className', () => {
    it('should render valid CSS', () => {
      const stylesheet = new StyleSheet()
      const className = stylesheet._renderClassName('0', 'x345')

      expect(className).to.eql('c0-x345')
    })
  })

  describe('Rendering a whole cache', () => {
    it('should render valid CSS', () => {
      const selector = new Selector(props => ({
        color: props.color,
        fontSize: '12px'
      }))

      const stylesheet = new StyleSheet()
      const staticClassName = stylesheet._renderSelectorVariation(selector)
      const dynamicClassName = stylesheet._renderSelectorVariation(selector, {
        color: 'red'
      })

      const css = stylesheet._renderCache(stylesheet.cache)

      expect(css).to.eql('.' + staticClassName + '{font-size:12px}.' + dynamicClassName.replace(staticClassName, '').trim() + '{color:red}')
    })

    it('should not render empty selectors', () => {
      const selector = new Selector(props => ({ fontSize: '12px' }))

      const stylesheet = new StyleSheet()
      const staticClassName = stylesheet._renderSelectorVariation(selector)
      const dynamicClassName = stylesheet._renderSelectorVariation(selector, {
        color: 'red'
      })

      const css = stylesheet._renderCache(stylesheet.cache)

      expect(css).to.eql('.' + staticClassName + '{font-size:12px}')
    })

    it('should split and render pseudo classes', () => {
      const selector = new Selector(props => ({
        color: 'red',
        ':hover': {
          color: 'blue',
          ':focus': {
            color: 'yellow',
            fontSize: '12px'
          }
        }
      }))

      const stylesheet = new StyleSheet()
      const className = stylesheet._renderSelectorVariation(selector)

      const css = stylesheet._renderCache(stylesheet.cache)

      expect(css).to.eql('.' + className + '{color:red}.' + className + ':hover{color:blue}.' + className + ':hover:focus{color:yellow;font-size:12px}')
    })
  })


  describe('Rendering to string', () => {
    it('should render all caches', () => {
      const selector = new MediaSelector(props => ({ color: 'red' }), {
        'min-height: 300px': props => ({ color: 'blue' })
      })

      const stylesheet = new StyleSheet()
      const staticClassName = stylesheet._renderSelectorVariation(selector)

      const css = stylesheet.renderToString()

      expect(css).to.eql('.' + staticClassName + '{color:red}@media(min-height: 300px){.' + staticClassName + '{color:blue}}')
    })

    it('should cluster media queries', () => {
      const selector = new MediaSelector(props => ({ color: 'red' }), {
        'min-height: 300px': props => ({ color: 'blue' })
      })

      const stylesheet = new StyleSheet()
      const staticClassName = stylesheet._renderSelectorVariation(selector)
      const dynamicClassName = stylesheet._renderSelectorVariation(selector, {
        foo: 'bar'
      })

      const css = stylesheet.renderToString()

      expect(css).to.eql('.' + staticClassName + '{color:red}@media(min-height: 300px){.' + staticClassName + '{color:blue}}')
    })

    it('should not render empty media styles', () => {
      const selector = new MediaSelector(props => ({
        color: props.color
      }), { 'min-height: 300px': props => ({ color: 'blue' }) })

      const stylesheet = new StyleSheet()
      const staticClassName = stylesheet._renderSelectorVariation(selector)
      const dynamicClassName = stylesheet._renderSelectorVariation(selector, {
        color: 'red'
      })

      const css = stylesheet.renderToString()

      expect(css).to.eql('.' + dynamicClassName.replace(staticClassName, '').trim() + '{color:red}@media(min-height: 300px){.' + staticClassName + '{color:blue}}')
    })

    it('should only render valid font face properties', () => {
      const fontFace = new FontFace('Arial', [ '../fonts/Arial.ttf', '../fonts/Arial.woff' ], {
        fontSize: '30px'
      })

      const stylesheet = new StyleSheet()
      const staticClassName = stylesheet._renderFontFace(fontFace)

      const css = stylesheet.renderToString()

      expect(css).to.eql('@font-face {font-family:\'Arial\';src:url(\'../fonts/Arial.ttf\') format(\'truetype\'),url(\'../fonts/Arial.woff\') format(\'woff\')}')
    })

    it('should render font faces', () => {
      const fontFace = new FontFace('Arial', [ '../fonts/Arial.ttf', '../fonts/Arial.woff' ], {
        fontWeight: 300
      })

      const stylesheet = new StyleSheet()
      const staticClassName = stylesheet._renderFontFace(fontFace)

      const css = stylesheet.renderToString()

      expect(css).to.eql('@font-face {font-family:\'Arial\';src:url(\'../fonts/Arial.ttf\') format(\'truetype\'),url(\'../fonts/Arial.woff\') format(\'woff\');font-weight:300}')
    })

    it('should render keyframe markup', () => {
      const keyframe = new Keyframe(props => ({
        from: {
          color: 'red'
        },
        to: {
          color: 'blue'
        }
      }))
      const sheet = new StyleSheet()

      const animationName = sheet._renderKeyframeVariation(keyframe)
      const keyframeMarkup = ' ' + animationName + '{from{color:red}to{color:blue}}'
      expect(sheet.renderToString()).to.eql([ '@-webkit-keyframes', '@-moz-keyframes', '@keyframes', '' ].join(keyframeMarkup))
    })
  })

  describe('Subscribing to the StyleSheet', () => {
    it('should call the callback each time it emits changes', () => {
      const selector = new MediaSelector(props => ({ color: 'red' }), {
        'min-height: 300px': props => ({ color: 'blue' })
      })

      const stylesheet = new StyleSheet()
      const subscriber = sinon.spy()
      stylesheet.subscribe(subscriber)
      const staticClassName = stylesheet._renderSelectorVariation(selector)

      expect(subscriber).to.have.been.calledOnce
    })

    it('should return a unsubscribe method', () => {
      const stylesheet = new StyleSheet()
      const subscriber = sinon.spy()

      const unsubscriber = stylesheet.subscribe(subscriber)
      unsubscriber.unsubscribe()

      expect(unsubscriber.unsibscribe).to.be.a.function
      expect(stylesheet.listeners.size).to.eql(0)
    })
  })

  describe('Splitting styles into pseudo classes', () => {
    it('should concat nested pseudo classes', () => {
      const selector = props => ({
        color: 'blue',
        fontSize: '12px',
        ':hover': {
          color: 'red',
          ':focus': {
            color: 'green'
          }
        },
        ':focus': {
          color: 'yellow'
        }
      })

      const stylesheet = new StyleSheet()
      const splitStyles = stylesheet._splitPseudoClasses(selector())

      expect(splitStyles).to.eql({
        '': {
          color: 'blue',
          fontSize: '12px'
        },
        ':hover': {
          color: 'red'
        },
        ':hover:focus': {
          color: 'green'
        },
        ':focus': {
          color: 'yellow'
        }
      })
    })

    it('should remove invalid properties', () => {
      const selector = props => ({
        color: props.color,
        display: [ '-webkit-box', 'flex' ],
        something: {
          color: 'blue'
        },
        fontSize: '12px',
        width: false
      })

      const stylesheet = new StyleSheet()
      const splitStyles = stylesheet._splitPseudoClasses(selector({}))

      expect(splitStyles['']).to.eql({ fontSize: '12px' })
    })

    it('should clean empty pseudo classes', () => {
      const selector = props => ({
        color: 'blue',
        fontSize: '12px',
        ':hover': {
          ':focus': {
            color: 'red'
          }
        },
        ':focus': {
          color: 'yellow'
        }
      })

      const stylesheet = new StyleSheet()
      const splitStyles = stylesheet._splitPseudoClasses(selector())

      expect(splitStyles).to.eql({
        '': {
          color: 'blue',
          fontSize: '12px'
        },
        ':hover:focus': {
          color: 'red'
        },
        ':focus': {
          color: 'yellow'
        }
      })
    })
  })

  describe('Preparing styles', () => {
    it('should keep static base styles even if empty', () => {
      const selector = props => ({
        ':hover': {
          ':focus': {
            color: 'red'
          }
        },
        ':focus': {
          color: 'yellow'
        }
      })

      const stylesheet = new StyleSheet()
      const pluginInterface = {
        styles: selector(),
        props: { },
        plugins: []
      }
      const splitStyles = stylesheet._prepareStyles(pluginInterface, {})
      const dynamicPluginInterface = {
        styles: selector({ color: 'red' }),
        props: {
          color: 'red'
        },
        plugins: []
      }
      const splitDynamicStyles = stylesheet._prepareStyles(dynamicPluginInterface, splitStyles)

      expect(splitDynamicStyles).to.eql({
        ':focus': {},
        ':hover:focus': {}
      })
    })
  })
})
