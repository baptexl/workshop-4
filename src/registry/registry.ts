import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { REGISTRY_PORT } from "../config";

export type Node = { nodeId: number; pubKey: string };

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};

export async function launchRegistry() {
  const app = express();
  app.use(express.json());
  app.use(bodyParser.json());
  let nodeRegistryBody: GetNodeRegistryBody = { nodes: [] };

  app.get("/status", getStatus);

  app.get("/getNodeRegistry", getNodeRegistry);

  app.post("/registerNode", registerNode);

  const server = app.listen(REGISTRY_PORT, () => {
    console.log(`Registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;

  function getStatus(req: Request, res: Response) {
    res.send("live");
  }

  function getNodeRegistry(req: Request, res: Response) {
    res.status(200).json(nodeRegistryBody);
  }

  function registerNode(req: Request<RegisterNodeBody>, res: Response) {
    const { nodeId, pubKey } = req.body;
    nodeRegistryBody.nodes.push({ nodeId, pubKey });
    res.status(200).json({ result: "ok" });
  }
}
