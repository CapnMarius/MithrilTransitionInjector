# Mithril Transition Injector

## Usage

### import in TypeScript

```typescript
import T, {inject} from "mithril-transition-injector";
```

### import in JavaScript

```javascript
const transitionInjector = require("mithril-transition-injector");
const T = transitionInjector.default;
const inject = transitionInjector.inject;
```

### example with wrapper tag

```typescript
import * as m from "mithril";
import T from "mithril-transition-injector";
import "./style.scss";

export default class App implements m.ClassComponent<any> {
  public view(v: m.CVnode<any>) {
    return <T delay={250} depth={3}>
      <div className="app" transition="slide-down">
        <div className="title" transition="slide-down">My Todo's</div>
        <button className="clear" transition="slide-down">X</button>

        <div className="todos">
          {this.todos.map((todo: ITodo, index: number) =>
            <Todo transition="slide-right" transitiongroup="todo" transitiondelay={100} key={todo.id} done={todo.done}>
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

### example with injection

```typescript
import * as m from "mithril";
import {inject} from "mithril-transition-injector";
import "./style.scss";

class App implements m.ClassComponent<any> {
  public view(v: m.CVnode<any>) {
    return <div className="app" transition="slide-down">
      <div className="title" transition="slide-down">My Todo's</div>
      <button className="clear" transition="slide-down">X</button>

      <div className="todos">
        {this.todos.map((todo: ITodo, index: number) =>
          <Todo transition="slide-right" transitiongroup="todo" transitiondelay={100} key={todo.id} done={todo.done}>
            {todo.title}
          </Todo>,
        )}
      </div>

      <input transition="slide-down" />
    </div>;
  }
}

export default inject(App, {depth: 3, delay: 250});
```

### example css transition classes

```css
$duration: .5;
$transitionBounce: cubic-bezier(.63, .44, .37, 1.72);

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

### options
```typescript
<T 
  group?: string; // defalt "main"
  delay?: number; // defalt 0
  pause?: number; // defalt 0
  depth?: number; // defalt 1
>
...
</T>
```

```typescript
<T>
  <div // or any other tag 
    transition: string;
    transitiongroup?: string;
    transitiondelay?: number;
    transitionpause?: number;
  >
  ...
  </div>
</T>
```

![example gif](https://github.com/CapnMarius/MithrilTransitionInjector/blob/master/example.gif?raw=true "Example GIF")
