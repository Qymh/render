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

export const Fragment = Symbol();
export const Portal = Symbol();

function normalizeVNodes(children) {
  const newChildren = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.key == null) {
      child.key = '|' + i;
    }
    newChildren.push(child);
  }
  return newChildren;
}

function createTextVNode(text) {
  return {
    _isVNode: true,
    flags: VNodeFlags.TEXT,
    tag: null,
    data: null,
    children: text,
    childFlags: ChildrenFlags.NO_CHILDREN,
    el: null
  };
}

function h(tag, data, children) {
  let flags = null;
  if (typeof tag === 'string') {
    flags = tag === 'svg' ? VNodeFlags.ELEMENT_SVG : VNodeFlags.ELEMENT_HTML;
  } else if (tag === Fragment) {
    flags = VNodeFlags.FRAGMENT;
  } else if (tag === Portal) {
    flags = VNodeFlags.PORTAL;
    tag = data && data.target;
  } else {
    flags =
      tag.prototype && tag.prototype.render
        ? VNodeFlags.COMPONENT_STATEFUL_NORMAL
        : VNodeFlags.COMPONENT_FUNCTIONAL;
  }

  let childFlags = null;
  if (Array.isArray(children)) {
    const { length } = children;
    if (length === 0) {
      childFlags = ChildrenFlags.NO_CHILDREN;
    } else if (length === 1) {
      childFlags = ChildrenFlags.SINGLE_VNODE;
      children = children[0];
    } else {
      childFlags = ChildrenFlags.KEYED_VNODES;
      children = normalizeVNodes(children);
    }
  } else if (children == null) {
    childFlags = ChildrenFlags.NO_CHILDREN;
  } else if (children._isVNode) {
    childFlags = ChildrenFlags.SINGLE_VNODE;
  } else {
    childFlags = ChildrenFlags.SINGLE_VNODE;
    children = createTextVNode(children + '');
  }

  return {
    _isVNode: true,
    flags,
    tag,
    data,
    children,
    childFlags,
    el: null
  };
}

class Component {
  render() {}
}

const test1 = h('div', null, '文本');

console.log(test1);

const test2 = h('div', null, h('span'));

console.log(test2);

const test3 = h(Fragment, null, [h('td'), h('td')]);

console.log(test3);

const test4 = h(Portal, { target: '#box' }, h('h1'));

console.log(test4);

function FunctionalComponent() {}

const test5 = h(FunctionalComponent, null, h('div'));

console.log(test5);

class StatefulComponent extends Component {}

const test6 = h(StatefulComponent, null, h('div'));

console.log(test6);
