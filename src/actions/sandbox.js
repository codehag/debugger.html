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
    const end = start + lines.length;
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
