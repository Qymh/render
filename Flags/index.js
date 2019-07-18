const VNodeFlags = {
  // html
  ELEMENT_HTML: 1,
  // svg
  ELEMENT_SVG: 1 << 1,
  // 状态组件
  COMPONENT_STATEFUL_NORMAL: 1 << 2,
  // 需要被keep-alive
  COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE: 1 << 3,
  // 已被keep-alive
  COMPONENT_STATEFUL_KEEP_ALIVE: 1 << 4,
  // 函数式
  COMPONENT_FUNCTIONAL: 1 << 5,

  // 纯文本
  TEXT: 1 << 6,
  // fragment
  FRAGMENT: 1 << 7,
  // portal
  PORTAL: 1 << 8
};

// 元素
VNodeFlags.ELEMENT = VNodeFlags.ELEMENT_HTML | VNodeFlags.ELEMENT_SVG;

// 有状态组件
VNodeFlags.COMPONENT_STATEFUL =
  VNodeFlags.COMPONENT_STATEFUL_NORMAL |
  VNodeFlags.COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE |
  VNodeFlags.COMPONENT_STATEFUL_KEEP_ALIVE;

// 组件
VNodeFlags.COMPONENT =
  VNodeFlags.COMPONENT_STATEFUL | VNodeFlags.COMPONENT_FUNCTIONAL;

const ChildrenFlags = {
  // 未知
  UNKNOWN_CHILDREN: 0,
  // 没有children
  NO_CHILDREN: 1,
  // 单vnode
  SINGLE_VNODE: 1 << 1,
  // 有key的多vnode
  KEYED_VNODES: 1 << 2,
  // 无key的多vnode
  NONE_KEYED_VNODES: 1 << 3
};

// 多节点
ChildrenFlags.MULTIPLE_VNODES =
  ChildrenFlags.KEYED_VNODES | ChildrenFlags.NONE_KEYED_VNODES;
