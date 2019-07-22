挂载

- 纯元素vnode
  - 创建元素
  - 挂载data
  - 赋值el
  - 遍历子vnode

- 文本vnode
  - 创建文本textNode
  - 赋值el
  - 挂载

- fragment
  - 遍历子vnode
  - 赋值el为当前子元素或子元素第一项或空文本节点

- portal
  - 寻找target
  - 遍历子vnode
  - 挂载到target
  - 赋值el为一个空文本节点

- 有状态组件
  - new 创建实例
  - 读取render
  - 遍历并挂载render返回的vnode

- 函数组件
  - 执行函数
  - 读取函数返回的render
  - 遍历并挂载render返回的vnode