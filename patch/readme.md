patch是在之前存在vnode的情况下进行vnode对比 更新dom

- 元素

  - 标签不同直接替换
  - 替换data
  - 比较子元素
    - 无子元素
      - 无子元素 不做处理
      - 一个子元素 挂载一个
      - 多个子元素 遍历挂载
    - 一个子元素
      - 无子元素 删除一个子元素
      - 一个子元素 和外层对比元素一致
      - 多个子元素 移除当前元素再遍历添加
    - 多个子元素
      - 无子元素 删除多个子元素
      - 一个子元素 删除多个子元素再添加
      - 多个子元素 diff算法

- 文本节点
  - 不同则替换

- fragment
  - 直接调用元素对比子元素的一套进行对比

- portal
  - 直接调用元素对比子元素的一套进行对比
  - 如果tag不同需要迁移元素

