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
class AlertView extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this)
  }

  componentDidMount() {
    window.gcexports.dispatcher.register(this.onChange);
  }

  onChange(data) {
    this.setState(Object.assign({}, this.state, data));
  }

  render() {
    let message;
    if (this.state && this.state[window.gcexports.id] &&
        this.state[window.gcexports.id].error) {
      // NOTE These messages can be modified on a per host basis.
      let status = this.state[window.gcexports.id].status;
      switch(status) {
      case 400:
        message = "Invalid input";
        break;
      case 401:
        message = "Sign in to start compiling";
        break;
      case 403:
        message = "You are not authorized to access this operation. Contact site administrator (admin@graffiticode.com) to get access";
        break;
      case 500:
        message = "Internal service error";
        break;
      case 408:
      case 503:
        message = "Service unavailable";
        break;
      default:
        message = "Unknown error (" + status + ")";
      }
    }
    if (message) {
      return (
        <div className="alert alert-danger" role="alert">
          {message}
        </div>
      );
    } else {
      return <div />;
    }
  }
}

export default AlertView;
