import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { useStoreState, useStoreActions } from "../store";
import React, { useEffect } from "react";
import { assertNever, onChangeFun, submitOnEnterKeyFun } from "../utils";
import { GoogleUserInfo } from "../storage/google-drive/shared";

export const GoogleGetFilenameFromUserModal = () => {
  const state = useStoreState(
    (state) => state.googleDriveImportExport.chooseFilenameFlow.state
  );
  const { setCurrentFilename, clearJustLaunched, submit, cancel } =
    useStoreActions(
      (actions) => actions.googleDriveImportExport.chooseFilenameFlow
    );

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();

  useEffect(() => {
    const element = inputRef.current;
    if (element != null && state.kind === "active" && state.justLaunched) {
      element.focus();
      // Initial value should always ends with ".zip", but check anyway:
      const unselectedLength = element.value.endsWith(".zip") ? 4 : 0;
      const selectionEnd = element.value.length - unselectedLength;
      element.setSelectionRange(0, selectionEnd, "forward");
      clearJustLaunched();
    }
  });

  if (state.kind === "idle") {
    return null;
  }

  const currentFilename = state.currentFilename;
  const filenameIsValid = currentFilename !== "" && currentFilename !== ".zip";

  const doSubmit = () => submit();
  const doCancel = () => cancel();

  const handleKeyPress = submitOnEnterKeyFun(doSubmit, filenameIsValid);

  return (
    <Modal
      className="GoogleGetFilenameFromUserModal"
      show={true}
      onHide={cancel}
      animation={false}
      centered
    >
      <Modal.Header>
        <Modal.Title>Export to Google Drive</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Name of file to export:</p>
        <Form>
          <Form.Control
            type="text"
            value={currentFilename}
            onChange={onChangeFun(setCurrentFilename)}
            onKeyDown={handleKeyPress}
            tabIndex={-1}
            ref={inputRef}
          />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={doCancel}>
          Cancel
        </Button>
        <Button
          disabled={!filenameIsValid}
          variant="primary"
          onClick={doSubmit}
        >
          Export
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export const GoogleAuthenticationStatusModal = () => {
  const authState = useStoreState(
    (state) => state.googleDriveImportExport.authState
  );
  const maybeBoot = useStoreActions(
    (actions) => actions.googleDriveImportExport.maybeBoot
  );

  useEffect(() => {
    maybeBoot();
  });

  switch (authState.kind) {
    case "succeeded":
    case "idle":
      return null;
    case "pending": {
      const cancelAuth = () => {
        // TODO: Should we abort with a string or an Error built from
        // that string?
        authState.abortController.abort("user cancelled authentication");
      };

      return (
        <Modal
          className="GoogleAuthenticationStatusModal"
          show={true}
          animation={false}
          centered
        >
          <Modal.Header>
            <Modal.Title>Connecting to Google account</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pending">
            <Spinner animation="border" />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelAuth}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      );
    }
    default:
      return assertNever(authState);
  }
};

type GoogleUserInfoSubHeaderProps = {
  user: GoogleUserInfo;
};

const GoogleUserInfoSubHeader: React.FC<GoogleUserInfoSubHeaderProps> = ({
  user,
}) => (
  <Modal.Header className="user-info">
    <p>{user.displayName}</p>
    <p>
      <code>{user.emailAddress}</code>
    </p>
  </Modal.Header>
);

type OutcomesOfKindProps = {
  summaries: Array<string>;
};

type OutcomesOfKindListProps = OutcomesOfKindProps & {
  intro: JSX.Element;
  className: string;
};

const OutcomesOfKindList: React.FC<OutcomesOfKindListProps> = ({
  summaries,
  intro,
  className,
}) => {
  return (
    <div className={`outcome-summary ${className}`}>
      {intro}
      <ul>
        {summaries.map((s, idx) => (
          <li key={idx}>{s}</li>
        ))}
      </ul>
    </div>
  );
};

const OutcomeSuccesses: React.FC<OutcomesOfKindProps> = ({ summaries }) => {
  const nSummaries = summaries.length;
  if (nSummaries === 0) {
    return null;
  }

  const intro =
    nSummaries === 1 ? (
      <p>
        The following operation was <strong>successful</strong>:
      </p>
    ) : (
      <p>
        The following operations were <strong>successful</strong>:
      </p>
    );

  return (
    <OutcomesOfKindList
      summaries={summaries}
      intro={intro}
      className="successes"
    />
  );
};

const OutcomeFailures: React.FC<OutcomesOfKindProps> = ({ summaries }) => {
  const nSummaries = summaries.length;
  if (nSummaries === 0) {
    return null;
  }

  const intro =
    nSummaries === 1 ? (
      <p>
        The following <strong>problem</strong> occurred:
      </p>
    ) : (
      <p>
        The following <strong>problems</strong> occurred:
      </p>
    );

  return (
    <OutcomesOfKindList
      summaries={summaries}
      intro={intro}
      className="failures"
    />
  );
};

export const GoogleTaskStatusModal = () => {
  const taskState = useStoreState(
    (state) => state.googleDriveImportExport.taskState
  );
  const setTaskState = useStoreActions(
    (actions) => actions.googleDriveImportExport.setTaskState
  );

  switch (taskState.kind) {
    case "idle":
    case "pending-already-modal":
      return null;
    case "pending": {
      return (
        <Modal
          className="GoogleTaskStatusModal"
          show={true}
          animation={false}
          centered
        >
          <Modal.Header>
            <Modal.Title>{taskState.summary}</Modal.Title>
          </Modal.Header>
          <GoogleUserInfoSubHeader user={taskState.user} />
          <Modal.Body className="pending">
            <Spinner animation="border" />
          </Modal.Body>
        </Modal>
      );
    }
    case "done": {
      const dismiss = () => setTaskState({ kind: "idle" });
      const taskOutcome = taskState.outcome;
      const maybeMessage = taskOutcome.message && <p>{taskOutcome.message}</p>;
      return (
        <Modal
          className="GoogleTaskStatusModal"
          show={true}
          animation={false}
          centered
        >
          <Modal.Header>
            <Modal.Title>{taskState.summary}</Modal.Title>
          </Modal.Header>
          <GoogleUserInfoSubHeader user={taskState.user} />
          <Modal.Body>
            {maybeMessage}
            <OutcomeSuccesses summaries={taskOutcome.successes} />
            <OutcomeFailures summaries={taskOutcome.failures} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={dismiss}>
              OK
            </Button>
          </Modal.Footer>
        </Modal>
      );
    }
    default:
      return assertNever(taskState);
  }
};
