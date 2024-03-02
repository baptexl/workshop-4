import express from "express";
import bodyParser from "body-parser";
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";
import { Node } from "../registry/registry";
import { exportPrvKey, exportPubKey, generateRsaKeyPair, rsaDecrypt, symDecrypt } from "../crypto";

export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  let lastReceivedEncryptedMessage: string | null = null;
  let lastReceivedDecryptedMessage: string | null = null;
  let lastMessageDestination: number | null = null;

  let rsaKeyPair = await generateRsaKeyPair();
  let pubKey = await exportPubKey(rsaKeyPair.publicKey);
  let privateKey = rsaKeyPair.privateKey;

  let node: Node = { nodeId: nodeId, pubKey: pubKey };

  onionRouter.get("/status", getStatus);

  onionRouter.get("/getLastReceivedEncryptedMessage", getLastReceivedEncryptedMessage);

  onionRouter.get("/getLastReceivedDecryptedMessage", getLastReceivedDecryptedMessage);

  onionRouter.get("/getLastMessageDestination", getLastMessageDestination);

  onionRouter.get("/getPrivateKey", getPrivateKey);

  onionRouter.post("/message", postMessage);

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  await registerNode(nodeId, pubKey);

  return server;

  async function getStatus(req: express.Request, res: express.Response) {
    res.send("live");
  }

  async function getLastReceivedEncryptedMessage(req: express.Request, res: express.Response) {
    res.status(200).json({ result: lastReceivedEncryptedMessage });
  }

  async function getLastReceivedDecryptedMessage(req: express.Request, res: express.Response) {
    res.status(200).json({ result: lastReceivedDecryptedMessage });
  }

  async function getLastMessageDestination(req: express.Request, res: express.Response) {
    res.status(200).json({ result: lastMessageDestination });
  }

  async function getPrivateKey(req: express.Request, res: express.Response) {
    res.status(200).json({ result: await exportPrvKey(privateKey) });
  }

  async function postMessage(req: express.Request, res: express.Response) {
    const { message } = req.body;
    const decryptedKey = await rsaDecrypt(message.slice(0, 344), privateKey);
    const decryptedMessage = await symDecrypt(decryptedKey, message.slice(344));

    const nextDestination = parseInt(decryptedMessage.slice(0, 10), 10);
    const remainingMessage = decryptedMessage.slice(10);
    lastReceivedEncryptedMessage = message;
    lastReceivedDecryptedMessage = remainingMessage;
    lastMessageDestination = nextDestination;
    await fetch(`http://localhost:${nextDestination}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: remainingMessage }),
    });
    res.status(200).send("success");
  }

  async function registerNode(nodeId: number, pubKey: string) {
    await fetch(`http://localhost:${REGISTRY_PORT}/registerNode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nodeId: nodeId,
        pubKey: pubKey,
      }),
    });
  }
}















