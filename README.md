Observable React
====

在 React 项目中更方便的使用 rx.js

开始使用
---

```bash
npm install observable-react
```

在组件的 `constructor` 中进行初始化：

```javascript
import setupObservables from 'obserbvable-react';

class Demo extends React.Component {
    constructor(props) {
        super(props);

        setupObservables(this);
    }
}
```



生命周期
---

初始化之后，生命周期被转化为以下**生命周期流**：

```javascript
this.componentWillMount$
this.componentDidMount$
this.componentWillReceiveProps$
this.shouldComponentUpdate$
this.componentWillUpdate$
this.componentDidUpdate$
this.componentWillUnmount$
this.componentDidCatch$
```

你可以像这样使用：

```javascript
const clock = Rx.Observable.interval(1000).takeUntil(this.componentWillUnmount$);
```

你也可以跟以前一样使用 React 的生命周期函数，不冲突。



快速将 Observables 绑定在 state 上
---

```javascript
this.setState$({
    foo: foo$,
    bar: bar$,
});
```

或者

```javascript
this.setState$(Rx.Observable.of({
    foo: 'foo',
    bar: 'bar',
}));
```

组件事件
---

快速添加事件流

```javascript
<Button onClick={this.ObservableEvent('buttonClick')} />
```

调用 `this.ObservableEvent` 会创建一个事件流: `this.buttonClick$`，在 `componentDidMount` 中可以使用：

```javascript
this.buttonClick$.subscribe(([event, nativeEvent]) => alert('按钮被点击！'));
```

由 `this.ObservableEvent` 创建的事件流默认发送组件的原生事件，你也可以为其添加参数来进行自定义：

- `this.ObservableEvent('buttonClick', (event) => event.target)` 转化组件原生事件
- `this.ObservableEvent('buttonClick', someData)` 发送自定义数据
- `this.ObservableEvent('buttonClick', someData, otherData)` 发送多个数据；发送时这些数据会被拼合成一个数组

### 预定义事件

可能有些组件是动态加载的，那么在 `componentDidMount` 中该事件流可能还未定义。可以在 `constructor` 中预先定义事件，以免出现报错。

```javascript
this.buttonClick$ = new Rx.Subject();
```

Ajax 请求
---

从 Ajax 请求快速创建数据流：假设 `fetchRemoteData` 是一个网络请求方法，返回 Promise。

```javascript
this.remoteData$ = this.createObservableRequest(fetchRemoteData, arg1, arg2);
```

或者

```
this.ObservableRequest('remoteData', fetchRemoteData, arg1, arg2);
```

这样创建的数据流不会立即进行请求，而是有观察者订阅时才会进行发送第一次请求。
数据流可以进行刷新：

```javascript
this.remoteData$.request();
```

假如每10秒刷新一次：

```javascript
Rx.Observable.interval(10000)
    .subscribe(() => this.remoteData$.request());
```

也可以为请求传入新的参数：

```javascript
this.remoteData$.request(newArg1, newArg2);
```

