// TODO: we would like to mock this in the local tests
const theMockedPendingBreakpoint = {
  location: {
    sourceId: "bar",
    sourceUrl: "http://todomvc.com/bar.js",
    line: 5,
    column: undefined
  },
  condition: "3",
  disabled: false
};

jest.mock("../../utils/prefs", () => ({
  prefs: {
    expressions: [],
    pendingBreakpoints: {
      "http://todomvc.com/bar.js:5:": {
        location: {
          sourceUrl: "http://todomvc.com/bar.js",
          line: 5,
          column: undefined
        },
        condition: "3",
        disabled: false
      }
    }
  }
}));

import { createStore, selectors, actions } from "../../utils/test-head";
import { makePendingLocationId } from "../../reducers/breakpoints";
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
    },
    condition: null,
    disabled: false
  };
}

function generatePendingBreakpoint(breakpoint) {
  const {
    location: { sourceUrl, line, column },
    condition,
    disabled
  } = breakpoint;

  return {
    location: { sourceUrl, line, column },
    condition,
    disabled
  };
}

describe("breakpoints", () => {
  it("pending breakpoints should be empty", async () => {
    const { getState } = createStore(simpleMockThreadClient);

    // await dispatch(actions.addBreakpoint({ sourceId: "a", line: 5 }));
    // await dispatch(actions.addBreakpoint({ sourceId: "b", line: 6 }));
    //
    expect(selectors.getPendingBreakpoints(getState()).size).to.be(1);
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
    const id = makePendingLocationId(bp.location);

    await dispatch(actions.addBreakpoint(bp.location));
    const pendingBps = selectors.getPendingBreakpoints(getState());
    expect(pendingBps.size).to.be(2);
    expect(pendingBps.get(id)).to.eql(generatePendingBreakpoint(bp));
  });

  describe("when two or more breakpoints are added", () => {
    let breakpoint1;
    let breakpoint2;
    let breakpointId1;
    let breakpointId2;

    beforeEach(() => {
      breakpoint1 = generateBreakpoint("foo");
      breakpoint2 = generateBreakpoint("foo2");
      breakpointId1 = makePendingLocationId(breakpoint1.location);
      breakpointId2 = makePendingLocationId(breakpoint2.location);
    });

    it("adds a corresponding pendingBreakpoint for each new addition", async () => {
      const { dispatch, getState } = createStore(simpleMockThreadClient);
      await dispatch(actions.addBreakpoint(breakpoint1.location));
      await dispatch(actions.addBreakpoint(breakpoint2.location));

      const pendingBps = selectors.getPendingBreakpoints(getState());
      expect(pendingBps.get(breakpointId1)).to.eql(
        generatePendingBreakpoint(breakpoint1)
      );
      expect(pendingBps.get(breakpointId2)).to.eql(
        generatePendingBreakpoint(breakpoint2)
      );
    });

    it("removes a corresponding pending breakpoint for each deletion", async () => {
      const { dispatch, getState } = createStore(simpleMockThreadClient);
      await dispatch(actions.addBreakpoint(breakpoint1.location));
      await dispatch(actions.addBreakpoint(breakpoint2.location));
      await dispatch(actions.removeBreakpoint(breakpoint1.location));

      const pendingBps = selectors.getPendingBreakpoints(getState());
      expect(pendingBps.has(breakpointId1)).not.to.be(true);
      expect(pendingBps.has(breakpointId2)).to.be(true);
    });
  });

  it("when the user disables a breakpoint, the corresponding pending breakpoint is also disabled", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);
    const bp = generateBreakpoint("foo");
    const id = makePendingLocationId(bp.location);

    await dispatch(actions.addBreakpoint(bp.location));
    await dispatch(actions.disableBreakpoint(bp.location));
    const bps = selectors.getPendingBreakpoints(getState());
    const breakpoint = bps.get(id);
    expect(breakpoint.disabled).to.be(true);
  });

  it("when the user updates a breakpoint, the corresponding pending breakpoints is updated", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);
    const bp = generateBreakpoint("foo");
    const id = makePendingLocationId(bp.location);

    await dispatch(actions.addBreakpoint(bp.location));
    await dispatch(
      actions.setBreakpointCondition(bp.location, { condition: "2" })
    );
    const bps = selectors.getPendingBreakpoints(getState());
    const breakpoint = bps.get(id);
    expect(breakpoint.condition).to.be("2");
  });

  it("when the user updates a breakpoint, the corresponding pending breakpoints are not removed", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);
    const bp = generateBreakpoint("foo");
    const id = makePendingLocationId(bp.location);

    await dispatch(actions.addBreakpoint(bp.location));
    await dispatch(
      actions.setBreakpointCondition(bp.location, { condition: "2" })
    );
    const bps = selectors.getPendingBreakpoints(getState());
    const breakpoint = bps.get(id);
    expect(breakpoint.condition).to.be("2");
  });

  it("when the debugger opens, it adds pending breakpoints", async () => {
    const { getState } = createStore(simpleMockThreadClient);
    const id = makePendingLocationId(theMockedPendingBreakpoint.location);
    const bps = selectors.getPendingBreakpoints(getState());
    const bp = bps.get(id);
    expect(bp).to.eql(generatePendingBreakpoint(theMockedPendingBreakpoint));
  });

  it("when a bp is added, where there is a corresponding pending breakpoint we update it", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);
    const bar = generateBreakpoint("bar.js");

    await dispatch(actions.addBreakpoint(bar.location));

    const bps = selectors.getPendingBreakpoints(getState());
    expect(bps.size).to.be(1);
  });

  it("when a bp is added, it does not remove the other pending breakpoints", async () => {
    const { dispatch, getState } = createStore(simpleMockThreadClient);
    const bp = generateBreakpoint("foo.js");

    await dispatch(actions.addBreakpoint(bp.location));

    const bps = selectors.getPendingBreakpoints(getState());
    expect(bps.size).to.be(2);
  });
});
