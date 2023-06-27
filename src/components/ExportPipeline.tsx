import { RouteComponentProps } from "@reach/router";
import React from "react";
import { assetServer } from "../skulpt-connection/asset-server"
import { ensureSoundManager } from "../skulpt-connection/sound-manager"
import txt from "../assets/globaldata-pytch.json";

interface ExportPipelineProps extends RouteComponentProps {}

declare var Sk: any;

var code: String = "";
var errors: String = "";

code = txt["1"]["code"];

enum BuildOutcomeKind {
  Success,
  Failure,
}

interface BuildSuccess {
  kind: BuildOutcomeKind.Success;
}

interface BuildFailure {
  kind: BuildOutcomeKind.Failure;
  error: any;
}

type BuildOutcome = BuildSuccess | BuildFailure;

const build = async (
): Promise<BuildOutcome> => {
  Sk.configure({
    __future__: Sk.python3,
  });
  try {
    ensureSoundManager();
    Sk.pytch.async_load_image = (name: string) => {
      return assetServer.loadImage(name);
    };
    await Sk.pytchsupport.import_with_auto_configure(code);
    return { kind: BuildOutcomeKind.Success };
  } 
  catch (err) {
    console.log(err)
    return { kind: BuildOutcomeKind.Failure, error: err };
  }
};

build()

const ExportPipeline: React.FC<ExportPipelineProps> = (ExportPipelineProps) => {
  return (
    <div>
      Code: {code}
      <br />
      Error: {errors}
    </div>
  );
};

export default ExportPipeline;
