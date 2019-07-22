h 函数的作用是创建 vnode 树

最终的 vnode 有

- \_isVNode 始终未 true
- tag 当前的 tag 值
  - 元素为元素名字
  - 文本为 null
  - portal 为 symbol portal
  - fragment 为 symbol fragment
- data 为当前元素属性的值
- flags 当前 vnode 标志
- childFlags 子 vnode 集合标志
- children 子 vnode
- el 当前 vnode 对应的真实 dom 此时为空
