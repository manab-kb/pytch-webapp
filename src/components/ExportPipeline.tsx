// @ts-nocheck

import { RouteComponentProps } from "@reach/router";
import React from "react";
import { assetServer } from "../skulpt-connection/asset-server";
import { ensureSoundManager } from "../skulpt-connection/sound-manager";
import txt from "../assets/globaldata-pytch.json";

interface ExportPipelineProps extends RouteComponentProps {}

declare var Sk: any;

var code: String = "";
var errors: String = "";
var flag = 0;
var globalerrors: String = "";

const build = async (code: String, errors: String) => {
  Sk.configure({
    __future__: Sk.python3,
  });
  try {
    ensureSoundManager();
    Sk.pytch.async_load_image = (name: string) => {
      return assetServer.loadImage(name);
    };
    await Sk.pytchsupport.import_with_auto_configure(code);
    errors += " CORRECT: No errors were found";
  } catch (err: any) {
    if (err.tp$name !== "PytchBuildError") {
      errors += " NOT-BUILD: Error thrown during build was not PytchBuildError";
    }

    if (err.innerError.tp$name === "PytchAssetLoadError") {
      errors += " CORRECT: No errors were found";
      flag = 1;
    }

    if (err.innerError.tp$name === "TigerPythonSyntaxAnalysis") {
      errors +=
        " SYNTAX: While compiling your code, Pytch encountered the following syntax errors :- ";
      err.innerError.syntax_errors.forEach((er: any) => {
        errors += "\nLine " + er.$lineno + " : " + er.$msg.v;
      });
    }

    if (err.phase === "import") {
      if (err.innerError.tp$name !== "TigerPythonSyntaxAnalysis") {
        errors +=
          " BUILD: While building your code, Pytch encountered the following error :- ";
        err.innerError.args.v.forEach((e: any) => {
          errors += "\n" + e.v;
        });
        err.innerError.traceback.forEach((er: any) => {
          errors += "\nLine: " + er.lineno + ", Col: " + er.colno;
        });
      }
    } else {
      if (flag === 0) {
        errors += " UNDEFINED : The following errors occured :- ";
        errors += "\n" + err;
        console.log(err);
      }
    }
  }
  return errors;
};

// TO-DO: Temporary fix for now, implement later
const updateProgress = () => {
  var progressBar = document.getElementById("progressBar");
  var progress = 0;

  var interval = setInterval(function () {
    progress += 1;
    if (progressBar !== null) {
      progressBar.value = progress;
    }

    if (progress === 100) {
      clearInterval(interval);
    }
  }, 100);
};

// TO-DO: Dispatch build runs in batches of 500 till all are complete ?
const ExportPipeline: React.FC<ExportPipelineProps> = (ExportPipelineProps) => {
  for (var i = 1; i <= 500; i++) {
    code = "";
    errors = "";
    flag = 0;

    code = txt[i]["code"];
    errors = build(code, errors);

    // eslint-disable-next-line
    errors.then((data) => {
      globalerrors += "////\n";
      globalerrors += data;
    });
  }

  const TextFile = () => {
    const element = document.createElement("a");
    const textFile = new Blob([JSON.stringify(globalerrors)], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(textFile);
    element.download = "data.txt";
    document.body.appendChild(element);
    element.click();
  };

  // TO-DO: Make progress bar responsive to tasks being performed
  return (
    <div align="center">
      <br />
      <h3>Export Pipeline</h3>
      <hr />
      <br />
      <br />
      <h5>
        Once the bar reaches 100%, click it to download the file containing
        outputs.
      </h5>
      <progress
        id="progressBar"
        value={0}
        max={100}
        onClick={TextFile}
        onMouseOver={updateProgress}
      />
    </div>
  );
};

export default ExportPipeline;
