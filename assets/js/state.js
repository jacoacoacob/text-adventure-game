

function createStateMachine({ current, transitions } = {}) {
  const state = {
    current,
    transitions,
    tick() {
      return this.transitions[this.current]();
    },
    setState(newState) {
      if (typeof transitions[newState] === "undefined") {
        console.warn(`[setState] transition "${newState}" not registered`);
        return;
      }
      this.current = newState;
      this.tick();
    },
  };

  return state;
}

export { createStateMachine };
