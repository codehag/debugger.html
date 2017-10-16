/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Sandbox reducer
 * @module reducers/sandbox
 */

const initialState = {
  sandbox: {
    start: null,
    end: null,
    currentStep: 0,
    slowMotion: false,
    paused: true
  }
};

function update(state = initialState, action) {
  switch (action.type) {
    case "ADD_SANDBOX":
      const { start, end } = action;
      return { ...state, start, end };
    case "CLEAR_SANDBOX":
      return { ...state, start: null, end: null };
    default:
      return state;
  }
}

export function getSandbox(state) {
  return state.sandbox;
}

export function getSandboxStart(state) {
  return state.sandbox.start;
}

export function getSandboxEnd(state) {
  return state.sandbox.end;
}

export default update;
