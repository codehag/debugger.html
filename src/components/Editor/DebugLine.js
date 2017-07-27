// @flow
import { PureComponent } from "react";
import { getDocument, toEditorPosition, markText } from "../../utils/editor";

type DebugLineProps = {
  sourceId: string,
  editor: any,
  selectedFrame: any,
  selectedLocation: any
};

let debugExpression;
class DebugLine extends PureComponent {
  props: DebugLineProps;

  componentDidUpdate(prevProps: DebugLineProps) {
    this.clearDebugLine(prevProps.selectedFrame);
    this.setDebugLine(this.props.selectedFrame, this.props.selectedLocation);
  }

  componentDidMount() {
    this.setDebugLine(this.props.selectedFrame, this.props.selectedLocation);
  }

  componentWillUnmount() {
    this.clearDebugLine(this.props.selectedFrame);
  }

  clearDebugLine(selectedFrame) {
    console.log(this.props, selectedFrame);
    if (this.props.editor && selectedFrame) {
      const { line } = selectedFrame.location;
      if (debugExpression) {
        debugExpression.clear();
      }

      this.props.editor.codeMirror.removeLineClass(
        line,
        "line",
        "new-debug-line"
      );
    }
  }

  setDebugLine(selectedFrame, selectedLocation) {
    if (
      this.props.editor &&
      selectedFrame &&
      selectedLocation &&
      selectedFrame.location.sourceId === selectedLocation.sourceId
    ) {
      const { location, sourceId } = selectedFrame;
      const { line, column } = toEditorPosition(sourceId, location);

      this.props.editor.codeMirror.addLineClass(line, "line", "new-debug-line");

      debugExpression = markText(this.props.editor, "debug-expression", {
        start: { line, column },
        end: { line, column: null }
      });
    }
  }

  render() {
    return null;
  }
}

DebugLine.displayName = "DebugLine";

export default DebugLine;
