
function delay(millis = 0) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

export { delay };
