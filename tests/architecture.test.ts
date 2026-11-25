import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const root: string = path.resolve(__dirname, "..");
const calls: Record<string, readonly string[]> = {
  "s1-inventory": [],
  "s2-order": [],
  "s3-member": [],
  "s4-payment": [],
  "s5-shipment": [],
  "s6-pricing": [],
  "s7-notification": [],
  "s8-reporting": ["s1-inventory", "s2-order", "s4-payment", "s5-shipment"],
  "s9-promotion": ["s1-inventory", "s7-notification"],
  "s10-live-selling": ["s1-inventory", "s2-order", "s7-notification"],
  "s11-sales-strategy": ["s8-reporting", "s7-notification"],
  "s12-order-fulfillment": [
    "s1-inventory",
    "s2-order",
    "s3-member",
    "s4-payment",
    "s5-shipment",
    "s6-pricing",
    "s7-notification",
  ],
  audit: [],
};
const owned: Record<string, readonly string[]> = {
  "s1-inventory": [
    "location",
    "bale",
    "item",
    "stockMovement",
    "stockCount",
    "stockCountLocation",
    "stockCountItem",
  ],
  "s2-order": ["order", "orderItem"],
  "s3-member": ["customer"],
  "s4-payment": ["invoice", "payment"],
  "s5-shipment": ["shipment", "shipmentEvent"],
  "s6-pricing": ["pricingRule", "discountRule"],
  "s7-notification": ["notificationLog"],
  "s9-promotion": ["promotion", "promotionItem"],
  "s10-live-selling": ["liveSession", "claim"],
  "s11-sales-strategy": ["strategy"],
  "s12-order-fulfillment": ["packingRecord"],
  audit: ["statusLog"],
};
const models: Set<string> = new Set(
  Object.values(owned).flat().concat("appUser"),
);
const methods: Set<string> = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "create",
  "createMany",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "upsert",
  "count",
  "aggregate",
  "groupBy",
]);

function files(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(dir, entry.name))
        : [path.join(dir, entry.name)],
    );
}
function source(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
}
function imports(file: string): string[] {
  return source(file).statements.flatMap((node) =>
    (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
    node.moduleSpecifier &&
    ts.isStringLiteral(node.moduleSpecifier)
      ? [node.moduleSpecifier.text]
      : [],
  );
}

describe("SOA architecture", () => {
  it("enforces declared Calls and service interfaces for cross-service imports", () => {
    for (const file of files(path.join(root, "services")).filter((file) =>
      file.endsWith(".ts"),
    )) {
      const owner = path
        .relative(path.join(root, "services"), file)
        .split(path.sep)[0];
      for (const specifier of imports(file)) {
        const target = specifier.match(
          /(?:^|\/)(s\d+-[a-z-]+|audit)(?:\/|$)/,
        )?.[1];
        if (!target || target === owner || target === "audit") continue;
        expect(calls[owner], file).toContain(target);
        expect(specifier, file).toMatch(/\/(?:service|types)$/);
      }
    }
  });
  it("has no dependency cycles or entity/utility imports of task services", () => {
    const tasks = new Set([
      "s10-live-selling",
      "s11-sales-strategy",
      "s12-order-fulfillment",
    ]);
    const graph: Record<string, string[]> = {};
    for (const owner of Object.keys(calls)) {
      graph[owner] = files(path.join(root, "services", owner))
        .flatMap(imports)
        .map(
          (specifier) => specifier.match(/(?:^|\/)(s\d+-[a-z-]+)(?:\/|$)/)?.[1],
        )
        .filter(
          (target): target is string => Boolean(target) && target !== owner,
        );
      if (!tasks.has(owner))
        for (const target of graph[owner])
          expect(tasks.has(target), owner).toBe(false);
    }
    function visit(owner: string, trail: readonly string[]): void {
      expect(trail, "dependency cycle").not.toContain(owner);
      for (const target of graph[owner]) visit(target, [...trail, owner]);
    }
    for (const owner of Object.keys(graph)) visit(owner, []);
  });
  it("accesses each Prisma model only inside its owner's repository", () => {
    for (const file of files(path.join(root, "services")).filter((file) =>
      file.endsWith(".ts"),
    )) {
      const owner = path
        .relative(path.join(root, "services"), file)
        .split(path.sep)[0];
      function visit(node: ts.Node): void {
        if (
          ts.isPropertyAccessExpression(node) &&
          methods.has(node.name.text) &&
          ts.isPropertyAccessExpression(node.expression) &&
          models.has(node.expression.name.text)
        ) {
          expect(path.basename(file), file).toBe("repository.ts");
          expect(owned[owner], file).toContain(node.expression.name.text);
        }
        if (ts.isPropertyAccessExpression(node))
          expect(node.name.text, file).not.toMatch(
            /^\$(?:queryRaw|executeRaw)/,
          );
        ts.forEachChild(node, visit);
      }
      visit(source(file));
    }
  });
  it("keeps Prisma out of dashboard pages", () => {
    const pages = [
      ...files(path.join(root, "app", "(dashboard)")),
      ...files(path.join(root, "src", "app", "(dashboard)")),
      ...files(path.join(root, "src", "app")).filter((file) =>
        file.endsWith(".tsx"),
      ),
      ...files(path.join(root, "src", "features")).filter((file) =>
        file.endsWith(".tsx"),
      ),
    ];
    for (const file of pages)
      expect(fs.readFileSync(file, "utf8"), file).not.toMatch(
        /@prisma\/client|(?:@backend\/|\.\.\/).*lib\/db/,
      );
  });
});
