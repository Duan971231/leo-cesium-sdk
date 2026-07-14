import { calculateHexWorkerResponse } from "./protocol";
import type { HexWorkerErrorResponse, HexWorkerRequest } from "../types/internal";

self.onmessage = (event: MessageEvent<HexWorkerRequest>): void => {
  console.log("into worker");
  try {
    self.postMessage(calculateHexWorkerResponse(event.data));
  } catch (error) {
    const response: HexWorkerErrorResponse = {
      id: event.data.id,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};
