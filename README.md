# Mithril Transition Injector

## Usage

### import in TypeScript
```typescript
import T from "mithril-transition-injector";
```
### import in JavaScript
```javascript
const T = require("mithril-transition-injector");
```

### example 
```typescript
import * as m from "mithril"; 
import T from "mithril-transition-injector";
import "./style.scss";

export default class App implements m.ClassComponent<any> {
  public view(v: m.CVnode<any>) {
    return <T delay={250} group="t" deep={3}>
      <div className="app t t-down">
        <div className="title t t-down">My Todo's</div>
        <button className="clear t t-down">X</button>
        
        <div className="todos">
          {this.todos.map((todo: ITodo, index: number) =>
            <Todo className="t t-right" key={todo.id} done={todo.done}>
              {todo.title}
            </Todo>,
          )}
        </div>
        
        <input className="create t t-down" />
      </div>
    </T>;
  }
}
```
```css
.t {
  transition: transform .5s cubic-bezier(.63, .44, .37, 1.72), opacity .5s;
  &.t-right {
    transform: translate3d(-100px, 0, 0);
    opacity: 0;
  }
  &.t-right-after {
    transform: translate3d(100px, 0, 0);
    opacity: 0;
  }
  
  &.t-down {
    transform: translate3d(0, -100px, 0);
    opacity: 0;
  }
  &.t-down-after {
    transform: translate3d(0, 100px, 0);
    opacity: 0;
  }
}
```

![example gif](https://github.com/CapnMarius/MithrilTransitionInjector/blob/master/example.gif?raw=true "Example GIF")
