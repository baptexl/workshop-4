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

  // Déclaration des handlers avant leur utilisation dans les routes
  function getStatus(req: Request, res: Response) {
    res.send("live");
  }

  function getNodeRegistry(req: Request, res: Response) {
    res.status(200).json(nodeRegistryBody);
  }

  function registerNode(req: Request, res: Response) {
    const newNode: Node = req.body;
    const exists = nodeRegistryBody.nodes.some(node => node.nodeId === newNode.nodeId);

    if (!exists) {
      nodeRegistryBody.nodes.push(newNode);
      res.status(201).json({ result: "Node registered successfully" });
    } else {
      res.status(409).json({ result: "Node ID already exists" });
    }
  }

  // Configuration des routes après la déclaration de toutes les fonctions
  app.get("/status", getStatus);
  app.get("/getNodeRegistry", getNodeRegistry);
  app.post("/registerNode", registerNode);

  const server = app.listen(REGISTRY_PORT, () => {
    console.log(`Registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}

