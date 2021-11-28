import React, { MouseEventHandler } from "react";
import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Form from "react-bootstrap/Form";
import {
  JoiningSessionState,
  LeavingSessionState,
  surveyUrl,
} from "../model/study-session";
import { useStoreState, useStoreActions } from "../store";
import { focusOrBlurFun, PYTCH_CYPRESS } from "../utils";

const maybeJoinStudyCode = () => {
  const joinMatcher = new RegExp("/join/([0-9a-f-]*)$");
  const joinMatch = joinMatcher.exec(window.location.href);
  return joinMatch == null ? null : joinMatch[1];
};

const ActionPendingSpinner = () => {
  return (
    <div className="modal-waiting-spinner">
      <Spinner animation="border" variant="primary" />
    </div>
  );
};

const inhibitDefaultIfRunningTests: MouseEventHandler<HTMLElement> = (e) => {
  // UGH: Don't actually open the survey under Cypress:
  if (PYTCH_CYPRESS()["inhibitNewTabLinks"]) {
    e.preventDefault();
  }
};

const JoinStudyModal: React.FC<JoiningSessionState> = (props) => {
  const [code, setCode] = useState("");
  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();

  const requestSession = useStoreActions(
    (actions) => actions.sessionState.requestSession
  );
  const launchPreSurveyAction = useStoreActions(
    (actions) => actions.sessionState.launchPreSurvey
  );
  const launchApp = useStoreActions(
    (actions) => actions.sessionState.launchApp
  );

  const isActive =
    props.phase.status !== "awaiting-user-ok" &&
    props.phase.status !== "showing-pre-survey-link";
  const isInteractable = props.phase.status === "awaiting-user-input";

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(focusOrBlurFun(inputRef, isActive, isInteractable));

  const submit = () =>
    requestSession({
      studyCode: props.studyCode,
      participantCode: code,
    });

  const launchPreSurvey: MouseEventHandler<HTMLElement> = (e) => {
    launchPreSurveyAction();
    inhibitDefaultIfRunningTests(e);
  };

  const button = ((): JSX.Element => {
    const phase = props.phase;
    switch (phase.status) {
      case "awaiting-user-input":
        return <Button onClick={submit}>Join</Button>;
      case "requesting-session":
        return <Button disabled>Joining...</Button>;
      case "showing-pre-survey-link":
        const url = surveyUrl("pre", phase.participantCode);
        return (
          <a href={url} target="_blank" rel="noreferrer">
            <Button onClick={launchPreSurvey}>
              Take the survey (in a new tab)
            </Button>
          </a>
        );
      case "awaiting-user-ok": {
        return <Button onClick={() => launchApp()}>Start using Pytch</Button>;
      }
    }
  })();

  const handleKeyPress: React.KeyboardEventHandler = (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      submit();
    }
  };

  const textPara = ((): JSX.Element => {
    switch (props.phase.status) {
      case "awaiting-user-input":
      case "requesting-session":
        return <p>Please enter your participant code:</p>;
      case "showing-pre-survey-link":
        return (
          <p>
            You have successfully joined the study. Please take the survey, by
            using the button below, then return to this tab to start using
            Pytch.
          </p>
        );
      case "awaiting-user-ok":
        return (
          <p>
            You have successfully joined the study. After taking the survey,
            please use the button below to start using Pytch.
          </p>
        );
    }
  })();

  const needRetryPara = props.nFailedAttempts > 0 && isActive;

  const retryPara = needRetryPara && (
    <p className="try-again-alert">
      Sorry, that participant code was not recognised. Please check it and try
      again.
    </p>
  );

  return (
    <div className="join-study-form-container">
      <Form>
        <h2>Pytch: Join study</h2>
        <p>Thank you for making Pytch better by taking part in this study.</p>
        {textPara}
        {isActive && (
          <Form.Control
            type="text"
            readOnly={props.phase.status !== "awaiting-user-input"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Participant code"
            tabIndex={-1}
            ref={inputRef}
          />
        )}
        {retryPara}
        <div className="buttons">{button}</div>
      </Form>
    </div>
  );
};

const JoinStudyFailure = () => {
  return (
    <div className="join-study-failure">
      <h2>Problem joining study</h2>
      <p>
        Sorry, something went wrong while trying to join the study. Please
        contact the Pytch team for help.
      </p>
    </div>
  );
};

const PostSurveyInvitation: React.FC<LeavingSessionState> = (props) => {
  const setSignedOutAction = useStoreActions(
    (actions) => actions.sessionState.setSignedOut
  );

  const setSignedOut: MouseEventHandler<HTMLElement> = (e) => {
    setSignedOutAction();
    inhibitDefaultIfRunningTests(e);
  };

  const url = surveyUrl("post", props.participantCode);

  return (
    <div className="signed-out-notice">
      <h2>Pytch</h2>

      <p>
        Thank you for using Pytch. Please now take the survey using the button
        below:
      </p>

      <div className="buttons">
        <a href={url} target="_blank" rel="noreferrer">
          <Button onClick={setSignedOut}>Take the survey (in a new tab)</Button>
        </a>
      </div>
    </div>
  );
};

const SignedOut = () => {
  return (
    <div className="signed-out-notice">
      <h2>Pytch</h2>

      <p>Thank you for taking part in the study!</p>
    </div>
  );
};

const MustUseStudyLink = () => {
  return (
    <div className="join-study-failure">
      <h2>Pytch</h2>

      <p>
        Pytch is a bridge from Scratch to Python. It helps people to learn
        Python by building on skills they have developed in Scratch.
      </p>

      <p>However, this is not the main Pytch site!</p>

      <p>
        If you have arrived at this page while trying to join a study to help
        make Pytch better, please directly use the link you were given.
      </p>

      <p>
        Otherwise, please go to{" "}
        <a href="https://pytch.org/">https://pytch.org/</a>.
      </p>

      <p>Thank you!</p>
    </div>
  );
};

const StudySessionManagerContent = () => {
  const sessionState = useStoreState((state) => state.sessionState);
  const actions = useStoreActions((actions) => actions.sessionState);

  const status = sessionState.status;

  useEffect(() => {
    if (status === "booting") {
      actions.boot(maybeJoinStudyCode());
    }
  });

  switch (status) {
    case "booting":
    case "signing-out":
      return <ActionPendingSpinner />;

    case "joining":
      return <JoinStudyModal {...(sessionState as JoiningSessionState)} />;

    case "validating-saved-session":
      return <ActionPendingSpinner />;

    case "failed":
      return <JoinStudyFailure />;

    case "no-valid-session":
      return <MustUseStudyLink />;

    case "showing-post-survey-link":
      return (
        <PostSurveyInvitation {...(sessionState as LeavingSessionState)} />
      );

    case "signed-out":
      return <SignedOut />;

    case "valid":
    case "not-in-use":
    default:
      // This can happen, for reasons related to the "zombie child"
      // React problem.
      return null;
  }
};

export const StudySessionManager = () => {
  return (
    <div className="App">
      <StudySessionManagerContent />
    </div>
  );
};
