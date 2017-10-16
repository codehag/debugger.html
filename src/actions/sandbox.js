/**
 * Debugger has just resumed
 *
 * @memberof actions/pause
 * @static
 */
export function addSandbox(selectedText, startLocation) {
  return ({ dispatch }: ThunkArgs) => {
    const lines = selectedText.split("\n");
    const start = startLocation;
    console.log(lines.length);
    const end = start + lines.length;
    console.log(end);
    dispatch({
      type: "ADD_SANDBOX",
      start,
      end
    });
  };
}

export function clearSandbox() {
  return ({ dispatch }: ThunkArgs) => {
    dispatch({
      type: "ClEAR_SANDBOX"
    });
  };
}
