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
import { ITodo, ITodos } from "../../types/todos";
import Todo from "../Todo/index";
import Controller from "./controller";
import Input from "../Input";
import T from "../T";
import "./style.scss";

export default class Todos implements m.ClassComponent<any> {
  private controller: Controller = new Controller();

  public view(v: m.CVnode<any>) {
    return <T delay={250} group="t" deep={3}>
      <div className="component--Todos t t-down">
        <div className="title t t-down">My Todo's</div>
        <button className="clear t t-down" onclick={() => this.controller.deleteAll()}>X</button>

        <div className="todos">
          {this.controller.todos.map((todo: ITodo, index: number) =>
            <Todo className="t t-right" key={todo.id} done={todo.done}
              ondonechange={(event, done: boolean): void => this.controller.update(index, { done })}
              ondelete={(event): void => this.controller.delete(index)}
            >{todo.title}</Todo>,
          )}
        </div>

        <Input className="t t-down"
          onenter={(event, value: string): string => {
            this.controller.create(value);
            return "";
          }}
        />
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

![example gif](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1")