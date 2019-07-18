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

function mountElement(vnode, container) {
  const isSVG = vnode.flags & VNodeFlags.ELEMENT_SVG;
  const el = isSVG
    ? document.createElementNS('http://www.w3.org/2000/svg', vnode.tag)
    : document.createElement(vnode.tag);
  vnode.el = el;

  const { data, childFlags, children } = vnode;
  if (data) {
    for (let key in data) {
      switch (key) {
        case 'style':
          for (let k in data.style) {
            el.style[k] = data.style[k];
          }
          break;
      }
    }
  }

  if (childFlags !== ChildrenFlags.NO_CHILDREN) {
    if (childFlags & ChildrenFlags.SINGLE_VNODE) {
      render(children, el);
    } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        render(child, el);
      }
    }
  }

  container.appendChild(el);
}

function render(vnode, container) {
  const { flags } = vnode;
  if (flags & VNodeFlags.ELEMENT) {
    mountElement(vnode, container);
  }
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

render(
  h(
    'div',
    {
      style: {
        height: '100px',
        width: '100px',
        backgroundColor: 'deepskyblue'
      }
    },
    [
      h('div', {
        style: {
          height: '50px',
          width: '50px',
          backgroundColor: 'green'
        }
      }),
      h('div', {
        style: {
          height: '10px',
          width: '10px',
          backgroundColor: 'red'
        }
      })
    ]
  ),
  document.getElementById('app')
);
