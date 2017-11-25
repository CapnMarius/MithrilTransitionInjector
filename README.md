# Mithril Transition Injector

## Usage

### import in TypeScript
```typescript
import Transition from "mithril-transition-injector";
```
### import in JavaScript
```javascript
const Transition = require("mithril-transition-injector");
```
### example
```typescript
<Transition group="text" delay={20}>
  {text.split(" ").map((word: string) => 
    <span className="color-red-black">{word}&nbsp;</span>
  )}
</Transition>
```
```css 
.color-red-black {
  transition: color 1s;

  // before visible
  color: red;    

  // visible
  &.oncreate {
    color: black; 
  }

  // after visible
  &.onbeforeremove {
    color: red; 
  }
}
```


```typescript
<Transition>
  <h1 className="slide-right-bounce">My awesome title</h1>
</Transition>
```
```css 
.slide-right-bounce {
  transition: transform 1s cubic-bezier(.63, .44, .37, 1.72), opacity 1s;
  
  // before visible
  transform: translate3d(-100px, 0, 0);
  opacity: 0;

  // visible
  &.oncreate {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }

  // after visible
  &.onbeforeremove {
    transform: translate3d(100px, 0, 0);
    opacity: 0;
  }
}
```