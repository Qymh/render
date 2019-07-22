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

const domPropsRE = /\W|^(?:value|checked|selected|muted)$/;

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
          for (let k in data[key]) {
            el.style[k] = data.style[k];
          }
          break;
        case 'class':
          el.className = data[key];
          break;
        default:
          if (key[0] === 'o' && key[1] === 'n') {
            el.addEventListener(key.slice(2), data[key]);
          } else if (domPropsRE.test(key)) {
            el[key] = data[key];
          } else {
            el.setAttribute(key, data[key]);
          }
          break;
      }
    }
  }

  if (childFlags !== ChildrenFlags.NO_CHILDREN) {
    if (childFlags & ChildrenFlags.SINGLE_VNODE) {
      mount(children, el, isSVG);
    } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        mount(child, el, isSVG);
      }
    }
  }

  container.appendChild(el);
}

function mountComponent(vnode, container, isSVG) {
  if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL) {
    mountStatefulComponent(vnode, container, isSVG);
  } else {
    mountFunctionalComponent(vnode, container, isSVG);
  }
}

function mountStatefulComponent(vnode, container, isSVG) {
  const instance = new vnode.tag();
  instance.$vnode = instance.mount();
  mount(instance.$vnode, container, isSVG);
  instance.$el = vnode.el = instance.$vnode.el;
}

function mountFunctionalComponent(vnode, container, isSVG) {
  const $vnode = vnode.tag();
  mount($vnode, container, isSVG);
  vnode.el = $vnode.el;
}

function mountText(vnode, container) {
  const el = document.createTextNode(vnode.children);
  vnode.el = el;
  container.appendChild(el);
}

function mountFragment(vnode, container, isSVG) {
  const { children, childFlags } = vnode;
  switch (childFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      mount(children, container, isSVG);
      vnode.el = children.el;
      break;
    case ChildrenFlags.NO_CHILDREN:
      const placeholder = createTextVNode('');
      mountText(placeholder, container);
      vnode.el = placeholder.el;
      break;
    default:
      for (let i = 0; i < children.length; i++) {
        mount(children[i], container, isSVG);
      }
      vnode.el = children[0].el;
  }
}

function mountProtal(vnode, container) {
  const { tag, children, childFlags } = vnode;
  const target = typeof tag === 'string' ? document.querySelector(tag) : tag;
  if (childFlags & ChildrenFlags.SINGLE_VNODE) {
    mount(children, target);
  } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
    for (let i = 0; i < children.length; i++) {
      mount(children[i], target);
    }
  }
  const placeholder = createTextVNode('');
  mountText(placeholder, container, null);
  vnode.el = placeholder.el;
}

function mount(vnode, container, isSVG) {
  const { flags } = vnode;
  if (flags & VNodeFlags.ELEMENT) {
    mountElement(vnode, container);
  } else if (flags & VNodeFlags.COMPONENT) {
    mountComponent(vnode, container, isSVG);
  } else if (flags & VNodeFlags.TEXT) {
    mountText(vnode, container);
  } else if (flags & VNodeFlags.FRAGMENT) {
    mountFragment(vnode, container, isSVG);
  } else if (flags & VNodeFlags.PORTAL) {
    mountProtal(vnode, container, isSVG);
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
      tag.prototype && tag.prototype.mount
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

function render(vnode, container) {
  const preVnode = container.vnode;
  if (!preVnode) {
    if (vnode) {
      mount(vnode, container);
      container.vnode = vnode;
    }
  }
}

// render(
//   h(
//     'div',
//     {
//       style: {
//         height: '100px',
//         width: '100px',
//         backgroundColor: 'deepskyblue'
//       }
//     },
//     [
//       h('div', {
//         style: {
//           height: '50px',
//           width: '50px',
//           backgroundColor: 'green'
//         }
//       }),
//       h('div', {
//         class: 'test',
//         style: {
//           height: '10px',
//           width: '10px',
//           backgroundColor: 'red'
//         }
//       })
//     ]
//   ),
//   document.getElementById('app')
// );

// render(
//   h('input', {
//     class: 'check',
//     type: 'checkbox',
//     checked: true,
//     custom: 'test'
//   }),
//   document.getElementById('app')
// );

// render(
//   h(
//     'div',
//     {
//       onclick: () => {
//         alert(1);
//       }
//     },
//     1
//   ),
//   document.getElementById('app')
// );

// render(
//   h(
//     'div',
//     {
//       style: { height: '100px', width: '100px', backgroundColor: 'red' }
//     },
//     h(Fragment, null, [h('h1', null, 'test1'), h('h1', null, 'test2')])
//   ),
//   document.getElementById('app')
// );

// render(h(Portal, { target: '#test' }, 1), document.getElementById('app'));

// class Test {
//   render() {
//     return h('div', null, 123);
//   }
// }

// render(h(Test), document.getElementById('app'));

function Test() {
  return h('div', null, 123);
}

render(h(Test), document.getElementById('app'));
