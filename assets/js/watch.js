
function useWatch(value) {
  const data = {
    current: value,
    previous: value
  };
  
  const watchers = [];
  
  function update(callback) {
    data.previous = data.current;
    data.current = callback(data.current);
    watchers.forEach(watcher => {
      watcher(data.current, data.previous);
    });
  }

  function watch(watcher, immediate = false) {
    if (!watchers.includes(watcher)) {
      watchers.push(watcher);
    }
    if (immediate) {
      watcher(data.current, data.previous);
    }
  }

  const rv = {
    watch,
    update,
  };

  Object.defineProperty(rv, "value", {
    get() {
      return data.current;
    }
  });

  return rv;
}

export { useWatch };
