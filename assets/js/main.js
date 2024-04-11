import { attrs, children, className, elem, listen, style, text } from "./elem.js"
import { createStateMachine } from "./state.js"
import { useWatch } from "./watch.js"
import { delay } from "./delay.js";

import * as gameData from "../../private/game-data.js";

const DISABLE_DELAY = true;

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

gameAchievements.watch(async (current, previous) => {
  if (Object.values(current).every((achievement) => achievement.complete)) {
    elem(".game-achievement", children(
      ...Object.values(current).map((achievement) => elem(
        "<div>",
        text(achievement.letter),
        attrs({
          title: gameData.finalPrize,
        }),
        className(
          "game-achievement__item",
          "game-achievement__item--complete",
          "game-achievement__item--complete-victory"
        ),
      ))
    ))
  } else {
    elem(".game-achievement", children(
      ...Object.entries(current).map(([achievementName, achievement]) => elem(
        "<div>",
        attrs({
          title: achievement.complete
            ? achievement.description
            : "You haven't completed this achievemnt yet",
        }),
        className(
          "game-achievement__item",
          achievement.complete && "game-achievement__item--complete",
          achievement.complete && !previous[achievementName].complete && "game-achievement__item--complete-fresh"
        ),
      ))
    ))
  }
}, true);

async function renderPanel({
  panelKey,
  title = "",
  narration = "",
  achievement = null,
  choices = {}
} = {}) {
  const _narration = narration.trim();

  if (achievement && !gameAchievements.value[achievement].complete) {
    gameAchievements.update((achievements) => {
      return {
        ...achievements,
        [achievement]: {
          ...achievements[achievement],
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
    if (DISABLE_DELAY) {
      return;
    }
    if (!VISITED_PANELS[panelKey]) {
      await delay(millis);
    } 
  }

  VISITED_PANELS[panelKey] = true;
  
  async function renderInstructions(charIdx = 0) {
    if (charIdx > _narration.length - 1) return;
    gameInstructions.textContent += _narration[charIdx];
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

function panel({ key, title, narration, choices, achievement } = {}) {
  return {
    [key]() {
      renderPanel({
        achievement,
        choices,
        title,
        narration,
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
