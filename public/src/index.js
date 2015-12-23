import ToolView from "./tool-view";
import SourceView from "./src-view";
import GraffView from "./graff-view";
import ObjectView from "./obj-view";
import ArchiveView from "./archive-view";
import Dispatcher from "./Dispatcher";
// This is the one and only dispatcher.
window.dispatcher = new Dispatcher;
React.render(
  React.createElement(ToolView, null),
  document.getElementById('tool-view')
);
React.render(
  React.createElement(SourceView, null),
  document.getElementById('src-view')
);
React.render(
  React.createElement(GraffView, null),
  document.getElementById('graff-view')
);
React.render(
  React.createElement(ObjectView, null),
  document.getElementById('obj-view')
);
React.render(
  React.createElement(ArchiveView, null),
  document.getElementById('archive-view')
);
