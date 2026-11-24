import { parentPort, workerData } from "node:worker_threads";
import { openDatabase } from "../../src/server/db.ts";
import { executeOperation } from "../../src/server/operations.ts";
const ctx = openDatabase(workerData.path);
parentPort.postMessage("ready");
parentPort.once("message", () => {
  try {
    const result = executeOperation(
      workerData.domain ?? "payments",
      workerData.command ?? { type: "approve", paymentId: "payment-fajar" },
      workerData.user,
      workerData.key,
      ctx,
      workerData.now,
    );
    parentPort.postMessage({ ok: true, replayed: result.replayed });
  } catch (error) {
    parentPort.postMessage({ ok: false, error: error.message });
  } finally {
    ctx.sqlite.close();
    parentPort.close();
  }
});
