import ToolView from "../lib/tool-view";
import SourceView from "../lib/src-view";
import GraffView from "../lib/graff-view";
import ObjectView from "../lib/obj-view";
import ArchiveView from "../lib/archive-view";
import Dispatcher from "../lib/Dispatcher";
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
