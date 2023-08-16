import React from "react";
import { useStoreState, useStoreActions } from "../store";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Tutorial from "./Tutorial";
import ErrorReportList from "./ErrorReportList";
import ProjectAssetList from "./ProjectAssetList";
import EditorWebSocketInfo from "./EditorWebSocketInfo";
import { LayoutChooser } from "./LayoutChooser";
import { isEnabled as liveReloadEnabled } from "../model/live-reload";
import { Button } from "react-chat-elements";
import PytchAssistant from "./PytchAssistant";

var isitAnError = false;

export function isError() {
  return isitAnError;
}

const StandardOutput = () => {
  const text = useStoreState((state) => state.standardOutputPane.text);

  const maybePlaceholder =
    text === "" ? (
      <p className="info-pane-placeholder">
        Anything your program prints will appear here.
      </p>
    ) : null;

  return (
    <div className="StandardOutputPane">
      {maybePlaceholder}
      <pre className="SkulptStdout">{text}</pre>
    </div>
  );
};

const InfoPanel = () => {
  const isSyncingFromBackEnd = useStoreState(
    (state) => state.activeProject.syncState.loadState === "pending"
  );
  const isTrackingTutorial = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial != null
  );
  const activeKey = useStoreState((state) => state.infoPanel.activeTabKey);
  const setActiveKey = useStoreActions(
    (state) => state.infoPanel.setActiveTabKey
  );
  const layoutKind = useStoreState((state) => state.ideLayout.kind);

  if (isSyncingFromBackEnd) {
    return null;
  }

  const Errors = () => {
    isitAnError = false;
    const errorList = useStoreState((state) => state.errorReportList.errors);
    if (errorList.length !== 0) {
      isitAnError = true;
    }
    const inner =
      errorList.length === 0 ? (
        <p className="info-pane-placeholder">
          Any errors your project encounters will appear here.
        </p>
      ) : (
        <div>
          <ErrorReportList />
          <div className="m-5">
            <p>Do you want to seek for help from the Pytch Assistant ? </p>
            <Button
              text={"Ask the Pytch Assistant"}
              onClick={() => {
                setActiveKey("assistant");
              }}
              title="Ask the Pytch Assistant"
            />
          </div>
        </div>
      );
    return <div className="ErrorsPane">{inner}</div>;
  };

  return (
    <div className="InfoPanel-container">
      <LayoutChooser />
      <Tabs
        className={`InfoPanel ${layoutKind}`}
        transition={false}
        activeKey={activeKey}
        onSelect={(k) => setActiveKey(k as string)}
      >
        {isTrackingTutorial && (
          <Tab className="InfoPane" eventKey="tutorial" title="Tutorial">
            <Tutorial />
          </Tab>
        )}
        <Tab className="InfoPane" eventKey="assets" title="Images and sounds">
          <ProjectAssetList />
        </Tab>
        <Tab className="InfoPane" eventKey="output" title="Output">
          <StandardOutput />
        </Tab>
        <Tab className="InfoPane" eventKey="errors" title="Errors">
          <Errors />
        </Tab>
        <Tab className="InfoPane" eventKey="assistant" title="Assistant">
          <PytchAssistant />
        </Tab>
        {liveReloadEnabled ? (
          <Tab
            className="InfoPane"
            eventKey="websocket-log"
            title="Editor WebSocket"
          >
            <EditorWebSocketInfo />
          </Tab>
        ) : null}
      </Tabs>
    </div>
  );
};

export default InfoPanel;
