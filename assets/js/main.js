import { attrs, children, className, elem, listen, style, text } from "./elem.js"
import { createStateMachine } from "./state.js"
import { useWatch } from "./watch.js"
import { delay } from "./delay.js";

import * as gameData from "../../private/game-data.js";

const VALID_STATES = gameData.panelConfig.map((data) => data.key);

const VISITED_PANELS = {};

const gameAchievements = useWatch(gameData.achievements);
const gameHistory = useWatch([
  {
    panelKey: "",
    state: "start",
  },
]);
const gamePosition = useWatch(0);
const renderPanelBusy = useWatch(false);

gameAchievements.watch(async (achievements) => {
  if (Object.values(achievements).every((achievement) => achievement.complete)) {

  } else {
    elem(".game-achievement", children(
      ...Object.values(achievements).map((achievement) => elem(
        "<div>",
        attrs({
          title: achievement.complete
            ? achievement.description
            : "You haven't completed this achievemnt yet",
        }),
        className(
          "game-achievement__item",
          achievement.complete && "game-achievement__item--complete",
        ),
      ))
    ))
  }
}, true);

async function renderPanel({
  panelKey,
  title = "",
  instructions = "",
  prize = null,
  choices = {}
} = {}) {
  const _instructions = instructions.trim();

  if (prize && !gameAchievements.value[prize].complete) {
    gameAchievements.update((achievements) => {
      return {
        ...achievements,
        [prize]: {
          ...achievements[prize],
          complete: true,
        },
      };
    });
  }

  const choiceKeys = Object.keys(choices);
  const gameChoices = elem(".game__choices", children());
  const gameInstructions = elem(".game__instructions", text())

  elem(".game__panel-title", text(title));

  renderPanelBusy.update(() => true);
  await renderInstructions();
  await panelDelay(100);
  await renderChoices();
  renderPanelBusy.update(() => false);

  async function panelDelay(millis) {
    if (true || !VISITED_PANELS[panelKey]) {
      await delay(millis);
    } 
  }

  VISITED_PANELS[panelKey] = true;
  
  async function renderInstructions(charIdx = 0) {
    if (charIdx > _instructions.length - 1) return;
    gameInstructions.textContent += _instructions[charIdx];
    await panelDelay(16)
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
    await panelDelay(25)
    await renderChoices(choiceKeyIdex + 1);
  }
}

function panel({ key, title, instructions, choices, prize } = {}) {
  return {
    [key]() {
      renderPanel({
        prize,
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
  transitions: gameData.panelConfig.reduce(
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
