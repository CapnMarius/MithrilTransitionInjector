# Mithril Transition Injector

## Usage

### import in TypeScript

```typescript
import T from "mithril-transition-injector";
```

### import in JavaScript

```javascript
const T = require("mithril-transition-injector").default;
```

### example

```typescript
import * as m from "mithril";
import T from "mithril-transition-injector";
import "./style.scss";

export default class App implements m.ClassComponent<any> {
  public view(v: m.CVnode<any>) {
    return <T delay={250}>
      <div className="app" transition="slide-down">
        <div className="title" transition="slide-down">My Todo's</div>
        <button className="clear" transition="slide-down">X</button>

        <div className="todos">
          {this.todos.map((todo: ITodo, index: number) =>
            <Todo transition="slide-right" key={todo.id} done={todo.done}>
              {todo.title}
            </Todo>,
          )}
        </div>

        <input transition="slide-down" />
      </div>
    </T>;
  }
}
```

```css
.slide-right {
  transition: transform #{$duration}s $transitionBounce, opacity #{$duration}s;
  &.before {
    transform: translateX(-100px);
    opacity: 0;
  }
  &.after {
    transform: translateX(100px);
    opacity: 0;
  }
}

.slide-down {
  transition: transform #{$duration}s $transitionBounce, opacity #{$duration}s;
  &.before {
    transform: translateY(-100px);
    opacity: 0;
  }
  &.after {
    transform: translateY(100px);
    opacity: 0;
  }
}
```

![example gif](https://github.com/CapnMarius/MithrilTransitionInjector/blob/master/example.gif?raw=true "Example GIF")
