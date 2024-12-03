import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import {
  ConnectionPlugin,
  Presets as ConnectionPresets,
} from "rete-connection-plugin";
import { LitPlugin, Presets, LitArea2D } from "@retejs/lit-plugin";
import { CustomNodeElement } from "./custom-node";
import { CustomConnectionElement } from "./custom-connection";
import { CustomSocketElement } from "./custom-socket";
import { addCustomBackground } from "./custom-background";
import { html } from "lit";

customElements.define("custom-node", CustomNodeElement);
customElements.define("custom-connection", CustomConnectionElement);
customElements.define("custom-socket", CustomSocketElement);

type Schemes = GetSchemes<
  ClassicPreset.Node,
  ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>
>;
type AreaExtra = LitArea2D<Schemes>;

export async function createEditor(container: HTMLElement) {
  const socket = new ClassicPreset.Socket("socket");

  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new LitPlugin<Schemes, AreaExtra>();

  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl(),
  });

  render.addPreset(
    Presets.classic.setup({
      customize: {
        node(data) {
          return ({ emit }) =>
            html`<custom-node .data=${data.payload} .emit=${emit}></rete-custom>`;
        },
        connection() {
          return ({ path }) =>
            html`<custom-connection .path=${path}></custom-connection>`;
        },
        socket(data) {
          return () => html`<custom-socket .data=${data}></custom-socket>`;
        },
      },
    })
  );

  connection.addPreset(ConnectionPresets.classic.setup());

  addCustomBackground(area);

  editor.use(area);
  area.use(connection);
  area.use(render);

  AreaExtensions.simpleNodesOrder(area);

  const a = new ClassicPreset.Node("Custom");
  a.addOutput("a", new ClassicPreset.Output(socket));
  a.addInput("a", new ClassicPreset.Input(socket));
  await editor.addNode(a);

  const b = new ClassicPreset.Node("Custom");
  b.addOutput("a", new ClassicPreset.Output(socket));
  b.addInput("a", new ClassicPreset.Input(socket));
  await editor.addNode(b);

  await area.translate(b.id, { x: 320, y: 0 });

  await editor.addConnection(new ClassicPreset.Connection(a, "a", b, "a"));

  AreaExtensions.zoomAt(area, editor.getNodes());

  return () => area.destroy();
}
