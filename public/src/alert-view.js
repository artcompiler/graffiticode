import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  assert,
  message,
  messages,
  reserveCodeRange,
  decodeID,
  encodeID,
} from "./share.js"
var AlertView = React.createClass({
  componentDidMount() {
    window.gcexports.dispatcher.register(this.onChange);
  },
  onChange(data) {
    this.setState(Object.assign({}, this.state, data));
  },
  render() {
    if (this.state && this.state[window.gcexports.id] &&
        this.state[window.gcexports.id].error) {
      // NOTE These messages can be modified on a per host basis.
      let status = this.state[window.gcexports.id].status;
      let message;
      switch(status) {
      case 401:
        message = "Sign in to start compiling.";
        break;
      case 403:
        message = "You are not authorized to access this operation. Contact site administrator (admin@graffiticode.com) to get access.";
        break;
      default:
        message = "Unknown error.";
      }
      return (        
        <div className="alert alert-danger" role="alert">
          {message}
        </div>
      );
    } else {
      return (
        <div />
      );
    }
  },
});
export default AlertView;
