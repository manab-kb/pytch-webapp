// @ts-nocheck
//Overview: Whenever the user types a message,  append in to the messagelist to be displayed, take the content from the message along with a current stage snapshot of the code from the state management system, feed it into the embedding creator, compare with 5 other embeddings, feed into GPT, get the prompt, store into the messagelist, and display the content, feed the messagelist from the next time to maintain context (provide embeddings only the first time, do not provide from the subsequent times to save up on tokens and maintain limit)

import React from "react";
import { codeReturner } from "./CodeEditor";
import "react-chat-elements/dist/main.css";
import { MessageList } from "react-chat-elements";
import { Input } from "react-chat-elements";
import weaviate, { WeaviateClient, ApiKey } from "weaviate-ts-client";
import fetch from "node-fetch";
import { Configuration, OpenAIApi } from "openai";
import {CodeSection} from "react-code-section-lib"

// TO-DO: Route requests through a backend server to prevent exposing the API key
const configuration = new Configuration({
  apiKey: "",
});
const openai = new OpenAIApi(configuration);

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
    // var context = "";

    var query = prompt + "\n\nCode:\n" + code;

    var tempQueryList = this.state.queryList;
    tempQueryList.push({ role: "user", content: query });
    this.setState({
      queryList: tempQueryList,
    });

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: this.state.queryList,
    });

    return await completion;
  };

  render() {
    return (
      <div>
        <br />
        <MessageList
          className="message-list"
          lockable={true}
          toBottomHeight={"100%"}
          dataSource={this.state.messageList}
        />

        <br />

        <div style={{ marginLeft: "1em" }}>
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

                this.completionFunc(this.state.inputVal, llmCode).then(
                  (data) => {
                    this.setState({
                      completion: data,
                    });

                    if (String(this.state.completion.data.choices[0].message.content).includes("```")) {
                      var assistantMsg = {
                        position: "left",
                        type: "text",
                        title: "Pytch Assistant",
                        text: this.state.completion.data.choices[0].message.content.split("```")[0],
                      };

                      var assistantCodeMsg = {
                        position: "left",
                        type: "text",
                        title: "Pytch Assistant",
                        text: this.state.completion.data.choices[0].message.content.split("```")[1]
                     // text: "<CodeSection> ${this.state.completion.data.choices[0].message.content.split(\"```\")[1]} </CodeSection>",
                      };

                      tempmsglist.push(assistantMsg);
                      tempmsglist.push(assistantCodeMsg);
                    } else {
                      var assistantMsg = {
                        position: "left",
                        type: "text",
                        title: "Pytch Assistant",
                        text: this.state.completion.data.choices[0].message.content,
                      };

                      tempmsglist.push(assistantMsg);
                    }

                    var tempQueryList = this.state.queryList;
                    tempQueryList.push({
                      role: "assistant",
                      content:
                        this.state.completion.data.choices[0].message.content,
                    });
                    this.setState({
                      queryList: tempQueryList,
                    });

                    this.setState({
                      messageList: tempmsglist,
                      inputVal: "",
                    });
                  }
                );
                // TO-DO: Clear input field before accepting new input
              }
            }}
          />
        </div>
      </div>
    );
  }
}

export default PytchAssistant;
