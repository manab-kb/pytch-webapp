import React, { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { useStoreActions, useStoreState } from "../store";

export const RenameAssetModal = () => {
  const [wasShowing, setWasShowing] = useState(false);
  const [name, setName] = useState("");
  const activeRename = useStoreState(
    (state) => state.userConfirmations.activeRenameAsset
  );
  const { dismissRename, doRename } = useStoreActions((actions) => ({
    dismissRename: actions.userConfirmations.dismissRenameAsset,
    doRename: actions.userConfirmations.doRenameAsset,
  }));

  const isShowing = activeRename != null;

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(() => {
    if (isShowing) inputRef.current!.focus();
  });

  const onClose = () => {
    dismissRename();
  };

  const onRename = () => {
    if (activeRename == null) {
      throw Error("cannot do rename if no activeRenameAsset");
    }
    doRename({
      oldName: activeRename.oldName,
      newName: name,
    });
  };

  const onKeyPress: React.KeyboardEventHandler = (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      inputRef.current!.blur();
      onRename();
    }
  };

  if (isShowing && !wasShowing) {
    // Initialise with suggested newName from caller.
    setName(activeRename?.newName || "SHOULD NOT SEE THIS");
    setWasShowing(true);
  }
  if (!isShowing && wasShowing) {
    setWasShowing(false);
  }

  return (
    <Modal show={isShowing} onHide={onClose} animation={false} centered>
      <Modal.Header closeButton>
        <Modal.Title>Rename "{activeRename?.oldName}"</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Control
            type="text"
            value={name}
            onChange={(evt) => setName(evt.target.value)}
            onKeyPress={onKeyPress}
            tabIndex={-1}
            ref={inputRef}
          ></Form.Control>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onRename}>
          Rename
        </Button>
      </Modal.Footer>
    </Modal>
  );
};