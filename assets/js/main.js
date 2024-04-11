import { attrs, children, className, elem, listen, style, text } from "./elem.js"
import { createStateMachine } from "./state.js"
import { useWatch } from "./watch.js"
import { delay } from "./delay.js";

import gameData from "../../private/game-data.js";

const VALID_STATES = gameData.map((data) => data.key);

const gameHistory = useWatch([
  {
    panelKey: "",
    state: "start",
  },
]);
const gamePosition = useWatch(0);
const renderPanelBusy = useWatch(false);

async function renderPanel({ panelKey, title, instructions, choices = {} } = {}) {

  const choiceKeys = Object.keys(choices);
  const gameChoices = elem(".game__choices", children());
  const gameInstructions = elem(".game__instructions", text())

  elem(".game__panel-title", text(title));

  renderPanelBusy.update(() => true);
  await renderInstructions();
  await delay(100);
  await renderChoices();
  renderPanelBusy.update(() => false);
  
  async function renderInstructions(charIdx = 0) {
    if (charIdx > instructions.length - 1) return;
    gameInstructions.textContent += instructions[charIdx];
    await delay(16);
    await renderInstructions(charIdx + 1);
  }

  async function renderChoices(choiceKeyIdex = 0) {
    if (choiceKeyIdex > choiceKeys.length - 1) return;
    const choiceKey = choiceKeys[choiceKeyIdex];
    const choiceText = choices[choiceKey];
    gameChoices.append(
      elem(
        "<li>",
        attrs({ role: "button" }),
        className("game__choices-choice"),
        text(choiceText),     
        listen({
          click: () => {
            if (!VALID_STATES.includes(choiceKey)) {
              console.warn("No game state registered for choice", choiceKey);
              return;
            }
            gameHistory.update(history => {
              const event = { panelKey, state: choiceKey };
              const indexOfPanelKey = history.findIndex(
                x => x.panelKey === panelKey
              );
              if (indexOfPanelKey > -1) {
                return history.slice(0, indexOfPanelKey).concat(event);
              }
              return history.concat(event);
            });
            gamePosition.update(() => gameHistory.value.length - 1);
          },
        })
      )
    )
    await delay(25);
    await renderChoices(choiceKeyIdex + 1);
  }
}

function panel({ key, title, instructions, choices } = {}) {
  return {
    [key]() {
      renderPanel({
        choices,
        title,
        instructions,
        panelKey: key,
      });
    }
  }
}

const gameState = createStateMachine({
  current: "start",
  transitions: gameData.reduce(
    (accum, panelConfig) => ({ ...accum, ...panel(panelConfig) }),
    {}
  ),
})

gamePosition.watch((position) => {
  const history = gameHistory.value;
  gameState.setState(history[position].state);
  elem("#btn-forward").disabled = renderPanelBusy.value || position === history.length - 1;
  elem("#btn-back").disabled = renderPanelBusy.value || position === 0
}, true);

renderPanelBusy.watch((busy) => {
  const history = gameHistory.value;
  const position = gamePosition.value;
  elem("#btn-forward").disabled = busy || position === history.length - 1;
  elem("#btn-back").disabled = busy || position === 0
});

elem("#btn-back", listen({
  click: () => {
    gamePosition.update(
      (current) => Math.max(current - 1, 0)
    );
  }
}));

elem("#btn-forward", listen({
  click: () => {
    gamePosition.update(
      (current) => Math.min(current + 1, gameHistory.value.length - 1)
    );
  }
}));
