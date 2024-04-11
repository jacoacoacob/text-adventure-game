
function useWatch(value) {
  const data = { value };
  
  const watchers = [];
  
  function update(callback) {
    data.value = callback(data.value);
    watchers.forEach(watcher => {
      watcher(data.value);
    });
  }

  function watch(watcher, immediate = false) {
    if (!watchers.includes(watcher)) {
      watchers.push(watcher);
    }
    if (immediate) {
      watcher(data.value);
    }
  }

  const rv = {
    watch,
    update,
  };

  Object.defineProperty(rv, "value", {
    get() {
      return data.value;
    }
  });

  return rv;
}

export { useWatch };
