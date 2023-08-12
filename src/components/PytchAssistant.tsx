// @ts-nocheck
//Overview: Whenever the user types a message,  append in to the messagelist to be displayed, take the content from the message along with a current stage snapshot of the code from the state management system, feed it into the embedding creator, compare with 5 other embeddings, feed into GPT, get the prompt, store into the messagelist, and display the content, feed the messagelist from the next time to maintain context (provide embeddings only the first time, do not provide from the subsequent times to save up on tokens and maintain limit)
import React from "react";
import axios from "axios";
import { codeReturner } from "./CodeEditor";
import "react-chat-elements/dist/main.css";
import { MessageList } from "react-chat-elements";
import { Input } from "react-chat-elements";
import { Button } from "react-chat-elements";
import weaviate, { WeaviateClient, ApiKey } from "weaviate-ts-client";
import fetch from "node-fetch";
import { Configuration, OpenAIApi } from "openai";
import { CodeSection } from "react-code-section-lib";

// TO-DO: Remove API Keys from code before pushing to GitLab & route Weaviate calls through different server too
// const client: WeaviateClient = weaviate.client({
//   scheme: "https",
//   host: "",
//   apiKey: new ApiKey("")
// });

class PytchAssistant extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      messageList: [
        {
          position: "left",
          type: "text",
          title: "Pytch Assistant",
          text: "Hi there !",
        },
      ],
      defaultVal: "Type here...",
      inputVal: "",
      embedding: "",
      context: "",
      completion: "",
      queryList: [
        {
          role: "system",
          content:
            "You are an expert in creative coding for kids in middle school who use the Pytch programming language. Given the current status of the code written by a student, your task is to involve in a conversation with the student to help correct errors in their code in a gradual way without providing the exact complete solution. In order to help the student, you can provide examples that are relevant yet different from the code provided but do not return the completed code at any cost.",
        },
      ],
    };

    this.completionFunc = this.completionFunc.bind(this);
    this.executeChat = this.executeChat.bind(this);
    this.clearChat = this.clearChat.bind(this);
  }

  completionFunc = async (prompt, code) => {
    // var embedding = await openai.createEmbedding({
    //   model: "text-embedding-ada-002",
    //   input: code,
    // });

    // var contextlist = await client.graphql
    //   .get()
    //   .withClassName("PromptAssistance")
    //   .withNearVector(embedding.data)
    //   .withLimit(5)
    //   .do();

    // // TO-DO: Pick all tut_text elements from the contextlist and store them in a newline separated string
    // var context = "\n\nContext:\n";

    // contextlist.data.Get.PromptAssistance.forEach((item) => {
    //   context += item["tut_text"];
    //   context += "\n"
    // })
    // console.log(context);

    var query = "\nCode:\n" + code + "\n\n" + prompt;

    var tempQueryList = this.state.queryList;
    tempQueryList.push({ role: "user", content: query });
    this.setState({
      queryList: tempQueryList,
    });

    const url =
      "https://fetch-openai-gpt-responses.azurewebsites.net/api/HttpTrigger1?code=kydZAUoXw3D2Q3PPff68kSA__vKKgiL8DehtvRnRhlYdAzFub5btKw==";

    const response = await axios.post(url, {
      prompt: this.state.queryList,
    });

    return await response;

    // TO-DO: Create logs of each API Call and store the conversations somewhere
  };

  executeChat = () => {
    var newMessageObj = {
      position: "right",
      type: "text",
      title: "User",
      text: this.state.inputVal,
    };

    var tempmsglist = this.state.messageList;
    tempmsglist.push(newMessageObj);

    this.setState({
      messageList: tempmsglist,
    });

    var llmCode = codeReturner();

    this.completionFunc(this.state.inputVal, llmCode).then((data) => {
      console.log(data.data.completion);

      if (String(data.data.completion).includes("```")) {
        var assistantMsg = {
          position: "left",
          type: "text",
          title: "Pytch Assistant",
          text: data.data.completion.split("```")[0],
        };

        var assistantCodeMsg = {
          position: "left",
          type: "text",
          title: "Pytch Assistant",
          text: data.data.completion.split("```")[1],
          // text: "<CodeSection> ${data.data.choices[0].message.content.split(\"```\")[1]} </CodeSection>",
        };

        tempmsglist.push(assistantMsg);
        tempmsglist.push(assistantCodeMsg);
      } else {
        var assistantMsg = {
          position: "left",
          type: "text",
          title: "Pytch Assistant",
          text: data.data.completion,
        };

        tempmsglist.push(assistantMsg);
      }

      var tempQueryList = this.state.queryList;
      tempQueryList.push({
        role: "assistant",
        content: data.data.completion,
      });
      this.setState({
        queryList: tempQueryList,
      });

      this.setState({
        messageList: tempmsglist,
        inputVal: "",
      });

      this.setState({
        completion: data.data.completion,
      });
    });
  };

  clearChat = () => {
    this.setState({
      messageList: [
        {
          position: "left",
          type: "text",
          title: "Pytch Assistant",
          text: "Hi there !",
        },
      ],
      queryList: [
        {
          role: "system",
          content:
            "You are an expert in creative coding for kids in middle school who use the Pytch programming language. Given the current status of the code written by a student, your task is to involve in a conversation with the student to help correct errors in their code in a gradual way without providing the exact complete solution. In order to help the student, you can provide examples that are relevant yet different from the code provided but do not return the completed code at any cost.",
        },
      ],
    });
  };

  render() {
    return (
      <div>
        <br />

        <div align="right" style={{ marginRight: "1em" }}>
          <Button
            text={"Clear Chat"}
            onClick={() => {
              alert("Deleting Current Chat History...");
              this.clearChat();
            }}
            title="Clear Chat"
          />
        </div>

        <MessageList
          className="message-list"
          lockable={true}
          toBottomHeight={"100%"}
          dataSource={this.state.messageList}
        />

        <br />

        <div id="inputDiv" style={{ marginLeft: "1em" }}>
          <Input
            placeholder={this.state.defaultVal}
            autofocus={true}
            onChange={(e1) => {
              this.setState({
                inputVal: e1.target.value,
              });
            }}
            onKeyPress={(e2) => {
              if (e2.key === "Enter") {
                var ele = document.getElementsByClassName("rce-input");
                ele[0].value = "";

                this.executeChat();
              }
            }}
          />
        </div>
      </div>
    );
  }
}

export default PytchAssistant;
