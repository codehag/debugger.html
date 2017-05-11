// jest.mock("../../utils/prefs");
// let stuff = {};
// jest.genMockFromModule("../../utils/prefs");
// const foo = jest.fn();
jest.mock("../../utils/prefs", () => ({
  prefs: {
    expressions: [],
    pendingBreakpoints: []
  }
}));

// , () => ({
//   prefs: {}
// }));

// console.log(bar);

// foo.mockImplementation(() => ({
//   pendingBreakpoints: []
// }));
//
import { createStore, selectors, actions } from "../../utils/test-head";
import { makeLocationId } from "../../reducers/breakpoints";
import expect from "expect.js";

const simpleMockThreadClient = {
  setBreakpoint: (location, condition) => {
    return new Promise((resolve, reject) => {
      resolve({ id: "hi", actualLocation: location });
    });
  },

  removeBreakpoint: id => {
    return new Promise((resolve, reject) => {
      resolve({ status: "done" });
    });
  },

  setBreakpointCondition: (id, location, condition, noSliding) => {
    return new Promise((resolve, reject) => {
      resolve({ sourceId: "a", line: 5 });
    });
  }
};

function generateBreakpoint(filename) {
  return {
    location: {
      sourceUrl: `http://todomvc.com/${filename}`,
      sourceId: filename,
      line: 5
    }
  };
}

function generatePendingBreakpoint(breakpoint) {
  return {
    sourceUrl: breakpoint.location.sourceUrl,
    line: breakpoint.location.line,
    column: undefined
  };
}

describe("breakpoints", () => {
  it("pending breakpoints should be empty", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);

    // await dispatch(actions.addBreakpoint({ sourceId: "a", line: 5 }));
    // await dispatch(actions.addBreakpoint({ sourceId: "b", line: 6 }));
    //
    expect(selectors.getPendingBreakpoints(getState()).length).to.be(0);
  });

  it("should remove a breakpoint", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);

    const loc1 = { sourceId: "a", line: 5 };
    const loc2 = { sourceId: "b", line: 6 };

    await dispatch(actions.addBreakpoint(loc1));
    await dispatch(actions.addBreakpoint(loc2));

    await dispatch(actions.removeBreakpoint(loc1));

    expect(selectors.getBreakpoints(getState()).size).to.be(1);
  });

  it("should disable a breakpoint", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);

    const loc1 = { sourceId: "a", line: 5 };
    const loc2 = { sourceId: "b", line: 6 };

    await dispatch(actions.addBreakpoint(loc1));
    await dispatch(actions.addBreakpoint(loc2));

    await dispatch(actions.disableBreakpoint(loc1));

    expect(selectors.getBreakpoint(getState(), loc1).disabled).to.be(true);
  });

  it("should enable breakpoint", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);
    const loc = { sourceId: "a", line: 5 };

    await dispatch(actions.addBreakpoint(loc));
    await dispatch(actions.disableBreakpoint(loc));

    expect(selectors.getBreakpoint(getState(), loc).disabled).to.be(true);

    await dispatch(actions.enableBreakpoint(loc));

    expect(selectors.getBreakpoint(getState(), loc).disabled).to.be(false);
  });

  it("should toggle all the breakpoints", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);

    const loc1 = { sourceId: "a", line: 5 };
    const loc2 = { sourceId: "b", line: 6 };

    await dispatch(actions.addBreakpoint(loc1));
    await dispatch(actions.addBreakpoint(loc2));

    await dispatch(actions.toggleAllBreakpoints(true));

    expect(selectors.getBreakpoint(getState(), loc1).disabled).to.be(true);
    expect(selectors.getBreakpoint(getState(), loc2).disabled).to.be(true);

    await dispatch(actions.toggleAllBreakpoints());

    expect(selectors.getBreakpoint(getState(), loc1).disabled).to.be(false);
    expect(selectors.getBreakpoint(getState(), loc2).disabled).to.be(false);
  });

  it("should set the breakpoint condition", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);

    const loc = { sourceId: "a", line: 5 };

    await dispatch(actions.addBreakpoint(loc));

    expect(selectors.getBreakpoint(getState(), loc).condition).to.be(null);

    await dispatch(
      actions.setBreakpointCondition(loc, {
        condition: "const foo = 0",
        getTextForLine: () => {}
      })
    );

    expect(selectors.getBreakpoint(getState(), loc).condition).to.be(
      "const foo = 0"
    );
  });
});

describe("pending breakpoints", () => {
  it("when the user adds a breakpoint, a corresponding pending breakpoint should be added", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);
    const bp = generateBreakpoint("foo");

    await dispatch(actions.addBreakpoint(bp.location));
    const pendingBps = selectors.getPendingBreakpoints(getState());
    expect(pendingBps.length).to.be(1);
    expect(pendingBps[0].location).to.eql(generatePendingBreakpoint(bp));
  });

  it("when the user adds a second breakpoint, a corresponding pending breakpoint should be added", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);
    const foo = generateBreakpoint("foo");
    const foo2 = generateBreakpoint("foo2");

    await dispatch(actions.addBreakpoint(foo.location));
    await dispatch(actions.addBreakpoint(foo2.location));

    const pendingBps = selectors.getPendingBreakpoints(getState());
    expect(pendingBps.length).to.be(2);
    expect(pendingBps[0].location).to.eql(generatePendingBreakpoint(foo));
    expect(pendingBps[1].location).to.eql(generatePendingBreakpoint(foo2));
  });

  it("when the user removes a breakpoint, the corresponding pending breakpoint is also removed", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);
    const bp = generateBreakpoint("foo");

    await dispatch(actions.addBreakpoint(bp.location));
    await dispatch(actions.removeBreakpoint(bp.location));
    const pendingBps = selectors.getPendingBreakpoints(getState());
    expect(pendingBps.length).to.be(0);
  });

  it("when the user disables a breakpoint, the corresponding pending breakpoint is also disabled", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);
    const bp = generateBreakpoint("foo");

    await dispatch(actions.addBreakpoint(bp.location));
    await dispatch(actions.disableBreakpoint(bp.location));
    const bps = selectors.getPendingBreakpoints(getState());
    const breakpoint = bps[0];
    expect(breakpoint.disabled).to.be(true);
  });

  it("when the user updates a breakpoint, the corresponding pending breakpoints are not removed", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);
    const bp = generateBreakpoint("foo");

    await dispatch(actions.addBreakpoint(bp.location));
    await dispatch(
      actions.setBreakpointCondition(bp.location, { condition: "2" })
    );
    const bps = selectors.getPendingBreakpoints(getState());
    const breakpoint = bps[0];
    expect(breakpoint.condition).to.be("2");
  });

  it.only("when the debugger opens, it adds pending breakpoints", async () => {
    console.log("STARTING TEST");
    jest.setMock("../../utils/prefs", () => ({
      prefs: { pendingBreakpoints: [{ foo: 2 }], expressions: [] }
    }));

    // prefs.pendingBreakpoints = [{ foo: 2 }];

    const { dispatch, getState } = createStore(simpleMockThreadClient);
    // const bp = generateBreakpoint("foo");

    // initializeStore()
    // await dispatch(actions.addBreakpoint(bp.location));
    const bps = selectors.getPendingBreakpoints(getState());
    const breakpoint = bps[0];
    console.log(bps);
    // expect(breakpoint.condition).to.be("2");
  });
});
