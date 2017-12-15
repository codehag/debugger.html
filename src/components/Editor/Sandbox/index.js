import React, { PureComponent } from "react";
import ReactDOM from "react-dom";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { range } from "lodash";

import { getDocument } from "../../../utils/editor/source-documents";
import actions from "../../../actions";
import {
  getSandboxStart,
  getSandboxEnd,
  getSelectedLocation
} from "../../../selectors";

import "./Sandbox.css";

class Sandbox extends PureComponent {
  props: Props;

  constructor() {
    super();
    this.sandboxPanel = null;
  }

  onNext = () => {
    console.log("next");
  };

  onStop = () => {
    console.log("stop");
  };

  onPrevious = () => {
    console.log("prev");
  };

  onSlowMo = () => {
    console.log("slowmo");
  };

  onClear = () => {
    this.props.clearSandbox();
  };

  clearSandbox(prevProps) {
    const { start, end, selectedLocation, editor } = prevProps;
    const { codeMirror } = editor;

    console.log("clear", start, end);
    const doc = getDocument(selectedLocation.sourceId);
    if (!doc) {
      range(start, end).forEach(line => {
        codeMirror.removeLineClass(line, "line", "highlight-lines");
      });
      return;
    }

    range(start, end).forEach(line => {
      doc.removeLineClass(line, "line", "sandbox-line");
    });
  }

  showSandbox(props) {
    const { start, end, selectedLocation, editor } = props;
    const { codeMirror } = editor;

    const doc = getDocument(selectedLocation.sourceId);
    if (!doc) {
      range(start, end).forEach(line => {
        codeMirror.addLineClass(line, "line", "highlight-lines");
      });
      return;
    }

    range(start, end).forEach(line => {
      doc.addLineClass(line, "line", "sandbox-line");
    });
  }

  componentWillUpdate(nextProps: Props) {
    console.log(nextProps);
    if (nextProps.start) {
      this.showSandbox(nextProps);
      return this.renderToWidget(nextProps);
    }
    this.clearSandbox(this.props);
    return this.clearWidget();
  }

  clearWidget() {
    if (this.cbPanel) {
      this.sandboxPanel.clear();
      this.sandboxPanel = null;
    }
  }

  renderToWidget(props: Props) {
    const { end, editor } = props;

    console.log(end);
    this.sandboxPanel = editor.codeMirror.addLineWidget(
      end,
      this.renderPanel(props),
      {
        coverGutter: true,
        noHScroll: false
      }
    );
  }

  renderPanel(props: Props) {
    const panel = document.createElement("div");
    ReactDOM.render(
      <div className="sandbox-buttons">
        <button onClick={this.onPrevious}>previous</button>
        <button onClick={this.onStop}>stop</button>
        <button onClick={this.onNext}>next</button>
        <button onClick={this.onSlowMo}>slow-motion</button>
        <button onClick={this.onRecord}>record</button>
        <button onClick={this.onClear}>clear</button>
      </div>,
      panel
    );
    return panel;
  }

  render() {
    return null;
  }
}

export default connect(
  state => ({
    start: getSandboxStart(state),
    end: getSandboxEnd(state),
    selectedLocation: getSelectedLocation(state)
  }),
  dispatch => bindActionCreators(actions, dispatch)
)(Sandbox);
