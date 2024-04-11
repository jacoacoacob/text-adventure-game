
function elem(selector, ...fns) {
  const element = selector.startsWith("<")
    ? document.createElement(selector.replace(/\W/g, ""))
    : document.querySelector(selector);

  (fns || []).forEach((fn) => {
    fn(element);
  });

  return element;
}

function attrs(attributes) {
  return el => {
    Object.keys(attributes).forEach(name => {
      el.setAttribute(name, attributes[name]);
    });
  }
}

function text(value = "") {
  return el => {
    el.textContent = value;
  }
}

function className(...classNames) {
  return el => {
    el.classList.add(...classNames.filter(Boolean));
  }
}

function listen(listeners = {}) {
  return el => {
    Object.keys(listeners).forEach(type => {
      el.addEventListener(type, listeners[type]);
    });
  }
}

/**
 * 
 * @param {CSSStyleDeclaration} options 
 * @returns 
 */
function style(options = {}) {
  return el => {
    Object.keys(options).forEach(key => {
      el.style[key] = options[key];
    });
  }
}

function children(...value) {
  return el => {
    while (el.lastChild) {
      el.removeChild(el.lastChild);
    }
    el.append(...value);
  }
}

export { elem, attrs, text, className, style, listen, children };
