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

function mountElement(vnode, container, refNode) {
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

  refNode ? container.insertBefore(el, refNode) : container.appendChild(el);
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
  instance._update = function() {
    if (instance._mounted) {
      const preVNode = instance.$vnode;
      const nextVNode = (instance.$vnode = instance.render());
      patch(preVNode, nextVNode, preVNode.el.parentNode);
      instance.$el = vnode.el = instance.$vnode.el;
    } else {
      instance.$vnode = instance.render();
      mount(instance.$vnode, container, isSVG);
      instance._mounted = true;
      instance.$el = vnode.el = instance.$vnode.el;
      instance.mounted && instance.mounted();
    }
  };
  instance._update();
}

function mountFunctionalComponent(vnode, container, isSVG) {
  vnode.handle = {
    pre: null,
    next: vnode,
    container,
    update() {
      if (vnode.handle.pre) {
        const preVNode = vnode.handle.pre;
        const nextVNode = vnode.handle.next;
      } else {
        const props = vnode.data;
        const $vnode = (vnode.children = vnode.tag(props));
        mount($vnode, container, isSVG);
        vnode.el = $vnode.el;
      }
    }
  };
  vnode.handle.update();
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

function mount(vnode, container, isSVG, refNode) {
  const { flags } = vnode;
  if (flags & VNodeFlags.ELEMENT) {
    mountElement(vnode, container, refNode);
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
    key: data && data.key ? data.key : null,
    children,
    childFlags,
    el: null
  };
}

function render(vnode, container) {
  const preVNode = container.vnode;
  if (!preVNode) {
    if (vnode) {
      mount(vnode, container);
      container.vnode = vnode;
    }
  } else {
    if (vnode) {
      patch(preVNode, vnode, container);
      container.vnode = vnode;
    }
  }
}

function replaceVNode(preVNode, nextVNode, container) {
  container.removeChild(preVNode.el);
  if (preVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
    const instance = preVNode.children;
    instance.unmounted && instance.unmounted();
  }
  mount(nextVNode, container);
}

export function patchData(el, key, preValue, nextValue) {
  switch (key) {
    case 'style':
      for (let k in nextValue) {
        el.style[k] = nextValue[k];
      }
      for (let k in preValue) {
        if (!nextValue.hasOwnProperty(k)) {
          el.style[k] = '';
        }
      }
      break;
    case 'class':
      el.className = nextValue;
      break;
    default:
      if (key[0] === 'o' && key[1] === 'n') {
        if (preValue) {
          el.removeEventListener(key.slice(2), preValue);
        }
        if (nextValue) {
          el.addEventListener(key.slice(2), nextValue);
        }
      } else if (domPropsRE.test(key)) {
        el[key] = nextValue;
      } else {
        el.setAttribute(key, nextValue);
      }
      break;
  }
}

function patchText(preVNode, nextVNode) {
  const el = (nextVNode.el = preVNode.el);
  if (nextVNode.children !== preVNode.children) {
    el.nodeValue = nextVNode.children;
  }
}

function patchElement(preVNode, nextVNode, container) {
  if (preVNode.tag !== nextVNode.tag) {
    replaceVNode(preVNode, nextVNode, container);
    return;
  }

  const el = (nextVNode.el = preVNode.el);

  const prevData = preVNode.data;
  const nextData = nextVNode.data;

  if (nextData) {
    for (let key in nextData) {
      const preValue = prevData[key];
      const nextValue = nextData[key];
      patchData(el, key, preValue, nextValue);
    }
  }

  if (prevData) {
    for (let key in prevData) {
      const preValue = prevData[key];
      if (preValue && !nextData.hasOwnProperty(key)) {
        patchData(el, key, preValue, null);
      }
    }
  }

  patchChildren(
    preVNode.childFlags,
    nextVNode.childFlags,
    preVNode.children,
    nextVNode.children,
    el
  );
}

function patchChildren(
  preChildFlags,
  nextChildFlags,
  preChildren,
  nextChildren,
  container
) {
  switch (preChildFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          patch(preChildren, nextChildren, container);
          break;
        case ChildrenFlags.NO_CHILDREN:
          container.removeChild(preChildren.el);
        default:
          container.removeChild(preChildren.el);
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container);
          }
          break;
      }
      break;
    case ChildrenFlags.NO_CHILDREN:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          mount(nextChildren, container);
          break;
        case ChildrenFlags.NO_CHILDREN:
          break;
        default:
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container);
          }
          break;
      }
    default:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          for (let i = 0; i < preChildren.length; i++) {
            container.removeChild(preChildren[i].el);
          }
          mount(nextChildren, container);
          break;
        case ChildrenFlags.NO_CHILDREN:
          for (let i = 0; i < preChildren.length; i++) {
            container.removeChild(preChildren[i].el);
          }
          break;
        default:
          const preLen = preChildren.length;
          const nextLen = nextChildren.length;
          const commonLen = Math.min(preLen, nextLen);
          for (let i = 0; i < commonLen; i++) {
            patch(preChildren[i], nextChildren[i], container);
          }
          let lastIndex = 0;
          for (let i = 0; i < preChildren.length; i++) {
            const preVNode = preChildren[i];
            let find = false;
            for (let j = 0; j < nextChildren.length; j++) {
              const nextVNode = nextChildren[j];
              if (preVNode.key === nextVNode.key) {
                find = true;
                if (j > lastIndex) {
                  lastIndex = j;
                } else {
                  container.insertBefore(nextChildren[j].el, preChildren[j].el);
                }
                break;
              }
            }
            if (!find) {
              container.removeChild(preVNode.el);
            }
          }
          nextChildren.forEach((v, i) => {
            if (!preChildren.some(t => t.key === v.key)) {
              mount(v, container, false, nextChildren[i + 1].el);
            }
          });
          break;
      }
      break;
  }
}

function patchFragment(preVNode, nextVNode, container) {
  patchChildren(
    preVNode.childFlags,
    nextVNode.childFlags,
    preVNode.children,
    nextVNode.children,
    container
  );

  switch (nextVNode.childFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      nextVNode.el = nextVNode.children.el;
      break;
    case ChildrenFlags.NO_CHILDREN:
      nextVNode.el = preVNode.el;
    default:
      nextVNode.el = nextVNode.children[0].el;
      break;
  }
}

function patchPortal(preVNode, nextVNode) {
  patchChildren(
    preVNode.childFlags,
    nextVNode.childFlags,
    preVNode.children,
    nextVNode.children,
    document.querySelector(preVNode.tag)
  );

  nextVNode.el = preVNode.el;

  if (nextVNode.tag !== preVNode.tag) {
    const container =
      typeof nextVNode.tag === 'string'
        ? document.querySelector(nextVNode.tag)
        : nextVNode.tag;

    switch (nextVNode.childFlags) {
      case ChildrenFlags.SINGLE_VNODE:
        container.appendChild(nextVNode.children.el);
        break;
      case ChildrenFlags.NO_CHILDREN:
        break;
      default:
        for (let i = 0; i < nextVNode.children.length; i++) {
          container.appendChild(nextVNode.children[i].el);
        }
        break;
    }
  }
}

function patchComponent(preVNode, nextVNode, container) {
  if (nextVNode.tag !== preVNode.tag) {
    replaceVNode(preVNode, nextVNode, container);
  } else if (nextVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
    const instance = (nextVNode.children = preVNode.children);
    instance.$props = nextVNode.data;
    instance._update();
  } else {
    const handle = (nextVNode.handle = preVNode.handle);
    handle.prev = preVNode;
    handle.next = nextVNode;
    handle.container = container;
    handle.update();
  }
}

function patch(preVNode, nextVNode, container) {
  const nextFlags = nextVNode.flags;
  const preFlags = preVNode.flags;

  if (preFlags !== nextFlags) {
    replaceVNode(preVNode, nextVNode, container);
  } else if (nextFlags & VNodeFlags.ELEMENT) {
    patchElement(preVNode, nextVNode, container);
  } else if (nextFlags & VNodeFlags.TEXT) {
    patchText(preVNode, nextVNode);
  } else if (nextFlags & VNodeFlags.FRAGMENT) {
    patchFragment(preVNode, nextVNode, container);
  } else if (nextFlags & VNodeFlags.PORTAL) {
    patchPortal(preVNode, nextVNode);
  } else if (nextFlags & VNodeFlags.COMPONENT) {
    patchComponent(preVNode, nextVNode, container);
  }
}

const preT = h('div', '', [
  h('div', { key: 'a' }, 'a'),
  h('div', { key: 'b' }, 'b'),
  h('div', { key: 'c' }, 'c'),
  h('div', { key: 'd' }, 'd')
]);
const curT = h('div', '', [
  h('div', { key: 'a' }, 'a'),
  h('div', { key: 'q' }, 'q'),
  h('div', { key: 'c' }, 'c'),
  h('div', { key: 'd' }, 'd')
]);

render(preT, document.getElementById('app'));
setTimeout(() => {
  render(curT, document.getElementById('app'));
}, 1000);
