function mountElement(vnode, container) {
  const el = document.createElement(vnode.tag);
  container.appendChild(el);
}

function mountComponent(vnode, container) {
  const instance = new vnode.tag();
  instance.$vnode = instance.render();
  mountElement(instance.$vnode, container);
}

function render(vnode, container) {
  if (typeof vnode.tag === 'string') {
    mountElement(vnode, container);
  } else {
    mountComponent(vnode, container);
  }
}

const test1 = {
  tag: 'div'
};

const test2 = {
  tag: class test2 {
    render() {
      return {
        tag: 'div'
      };
    }
  }
};

render(test1, document.getElementById('app'));
render(test2, document.getElementById('app'));
