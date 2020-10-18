import React, { ChangeEvent, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";

export const RenameAssetModal = () => {
  const {
    oldName,
    newName,
    isActive,
    isInteractable,
    attemptSucceeded,
    maybeLastFailureMessage,
    inputsReady,
  } = useStoreState((state) => state.userConfirmations.renameAssetInteraction);

  const { attempt, dismiss, setNewName, setInputsReady } = useStoreActions(
    (actions) => actions.userConfirmations.renameAssetInteraction
  );

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(() => {
    if (isActive) {
      const inputElt = inputRef.current!;
      if (isInteractable) {
        inputElt.focus();
      } else {
        inputElt.blur();
      }
    }
  });

  const handleClose = () => dismiss();
  const handleRename = () => {
    inputRef.current!.blur();
    attempt({ oldName, newName });
  };

  const handleKeyPress: React.KeyboardEventHandler = (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      if (inputsReady) {
        handleRename();
      }
    }
  };

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;
    setInputsReady(value !== "" && value !== oldName);
    setNewName(value);
  };

  // onChange= set "user has modified suggestion" bit?

  return (
    <Modal show={isActive} onHide={handleClose} animation={false} centered>
      <Modal.Header closeButton={isInteractable}>
        <Modal.Title>Rename "{oldName}"</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Control
            type="text"
            value={newName}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            tabIndex={-1}
            ref={inputRef}
          ></Form.Control>
        </Form>
        <MaybeErrorOrSuccessReport
          messageWhenSuccess="Renamed!"
          attemptSucceeded={attemptSucceeded}
          maybeLastFailureMessage={maybeLastFailureMessage}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={!isInteractable}
          variant="secondary"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          disabled={!(isInteractable && inputsReady)}
          variant="primary"
          onClick={handleRename}
        >
          Rename
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
