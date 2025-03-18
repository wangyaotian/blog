# React

公司业务中技术栈主要是Vue和Flutter,一直没有机会尝试用React去写项目，React学了很久了，过段时间就会忘掉，便记录下。

## React 16.3 之前的旧版生命周期

### 挂载阶段（Mounting）

组件实例被创建并插入 DOM 中，以下是按执行顺序的主要方法：

1. componentWillMount()：在组件即将被挂载到页面的时刻执行，此时可以进行一些初始化操作，如设置 state 等，但在这个方法里进行异步操作（如 setState）可能会导致意外的渲染结果，并且在 React 17 中已被弃用。
2. render()：这是一个必需的方法，它会返回一个 React 元素，用于描述组件的 UI 结构。此方法应该是纯函数，不应该有任何副作用。  
3. componentDidMount()：组件已经被挂载到 DOM 之后执行，常用于进行网络请求、订阅事件、初始化第三方库等操作，因为此时组件已经有了真实的 DOM 节点。

### 更新阶段（Updating）

当组件的 props 或 state 发生变化时，会触发更新阶段，按执行顺序的主要方法有：  

1. componentWillReceiveProps(nextProps)：当组件接收到新的 props 时会被调用，可以在这个方法里根据新的 props 来更新 state，不过在 React 17 中已被弃用
2. shouldComponentUpdate(nextProps, nextState)：这是一个重要的性能优化方法，它会返回一个布尔值，决定组件是否需要重新渲染。默认返回 true，如果返回 false，则组件不会执行后续的更新流程。
3. componentWillUpdate(nextProps, nextState)：在组件即将更新之前调用，此时可以进行一些准备工作，但不能在此方法中调用 setState，在 React 17 中已被弃用。
4. render()：重新渲染组件，返回新的 React 元素。
5. componentDidUpdate(prevProps, prevState)：组件更新完成后调用，常用于在更新后操作 DOM 或进行网络请求。

## React 16.3 - React 17 的新版生命周期

  为了更好地支持异步渲染，React 16.3 引入了两个新的生命周期方法，同时弃用了一些旧的方法。

### 挂载阶段

1. static getDerivedStateFromProps(props, state)：这是一个静态方法，在组件实例化或接收到新的 props 时被调用，用于根据 props 来更新 state，它应该返回一个对象来更新 state，或者返回 null 表示不更新。
2. render()：同旧版。
3. componentDidMount()：同旧版。

### 更新阶段

1. static getDerivedStateFromProps(props, state)：接收到新的 props 时调用，用于更新 state。
2. shouldComponentUpdate(nextProps, nextState)：同旧版。
3. render()：同旧版。
4. getSnapshotBeforeUpdate(prevProps, prevState)：在最近一次渲染输出（提交到 DOM 节点）之前调用，它可以返回一个值，这个值会作为参数传递给 componentDidUpdate。
5. componentDidUpdate(prevProps, prevState, snapshot)：组件更新完成后调用，snapshot 是 getSnapshotBeforeUpdate 返回的值。

### 卸载阶段

1. componentWillUnmount()：同旧版。

## React 18 的生命周期变化

React 18 引入了并发模式，对部分生命周期进行了调整，主要是一些旧的生命周期方法被标记为不安全，如 componentWillMount、componentWillReceiveProps 和 componentWillUpdate 被彻底弃用。

```tsx
import React, { Component } from 'react';

class MyComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            count: 0
        };
    }

    static getDerivedStateFromProps(props, state) {
        // 根据 props 更新 state
        return null;
    }

    componentDidMount() {
        console.log('Component did mount');
    }

    shouldComponentUpdate(nextProps, nextState) {
        return true;
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        // 在更新前获取一些信息
        return null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        console.log('Component did update');
    }

    componentWillUnmount() {
        console.log('Component will unmount');
    }

    render() {
        return (
            <div>
                <p>Count: {this.state.count}</p>
                <button onClick={() => this.setState({ count: this.state.count + 1 })}>
                    Increment
                </button>
            </div>
        );
    }
}

export default MyComponent;
```

## React函数组件生命周期

在 React 函数组件中，没有像类组件那样固定的生命周期方法，但可以使用 React Hooks 来模拟实现类似的生命周期功能。下面详细介绍如何利用 Hooks 实现与类组件生命周期对应的功能：

### 挂载阶段

类组件中的 componentDidMount 方法在组件挂载到 DOM 后执行，常用于进行网络请求、订阅事件等操作。在函数组件中，可以使用 useEffect 钩子来模拟这一行为。

```tsx
import React, { useEffect } from 'react';

const MyFunctionComponent = () => {
    useEffect(() => {
        // 这里的代码会在组件挂载后执行
        console.log('组件已挂载');

        // 可以进行网络请求等操作
        // 例如：fetchData();

        // 返回一个清理函数，用于在组件卸载时执行
        return () => {
            console.log('组件即将卸载');
        };
    }, []); // 空依赖数组表示只在组件挂载和卸载时执行

    return <div>这是一个函数组件</div>;
};

export default MyFunctionComponent;
```

在上述代码中，useEffect 接收两个参数，第一个参数是一个回调函数，第二个参数是一个依赖数组。当依赖数组为空时，回调函数只会在组件挂载和卸载时执行，模拟了 componentDidMount 和 componentWillUnmount 的功能。

### 更新阶段

类组件中的 componentDidUpdate 方法在组件更新后执行，常用于在更新后操作 DOM 或进行网络请求。在函数组件中，同样可以使用 useEffect 来模拟。

```tsx
import React, { useState, useEffect } from 'react';

const MyFunctionComponent = () => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        // 这里的代码会在组件挂载和每次更新后执行
        console.log('组件已更新，当前 count 值为：', count);

        // 可以进行一些操作，如根据 count 值更新 DOM

        return () => {
            // 清理操作，例如取消订阅等
        };
    }, [count]); // 依赖数组中包含 count，当 count 变化时，回调函数会执行

    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>增加计数</button>
        </div>
    );
};

export default MyFunctionComponent;
```

在这个例子中，useEffect 的依赖数组包含了 count，当 count 的值发生变化时，回调函数会执行，模拟了 componentDidUpdate 的功能。

### 卸载阶段

类组件中的 componentWillUnmount 方法在组件卸载前执行，用于清理工作，如取消网络请求、清除定时器、取消订阅事件等。在函数组件中，useEffect 的回调函数可以返回一个清理函数，这个清理函数会在组件卸载时执行。

```tsx
import React, { useEffect } from 'react';

const MyFunctionComponent = () => {
    useEffect(() => {
        // 模拟订阅事件
        const subscription = subscribeToSomeEvent();

        return () => {
            // 组件卸载时取消订阅
            unsubscribeFromSomeEvent(subscription);
        };
    }, []); // 空依赖数组表示只在组件挂载和卸载时执行

    return <div>这是一个函数组件</div>;
};

// 模拟订阅和取消订阅函数
const subscribeToSomeEvent = () => {
    console.log('订阅事件');
    return {};
};

const unsubscribeFromSomeEvent = (subscription) => {
    console.log('取消订阅事件');
};

export default MyFunctionComponent;
```

在上述代码中，useEffect 的回调函数返回了一个清理函数，当组件卸载时，清理函数会被调用，模拟了 componentWillUnmount 的功能。
通过使用 useEffect 钩子，函数组件可以实现与类组件生命周期类似的功能，并且代码更加简洁和易于维护。
