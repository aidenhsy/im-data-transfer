// scripts/merge-openapi.ts
import fs from 'node:fs/promises';

type OpenAPI = any;

/**
 * Prefix component schema names to avoid collisions:
 *   CreateEmployeeDto -> HR_CreateEmployeeDto
 * And rewrite all $ref occurrences accordingly.
 */
function prefixSchemas(doc: OpenAPI, prefix: string) {
  if (!doc.components) doc.components = {};
  if (!doc.components.schemas) return doc;

  const schemas = doc.components.schemas as Record<string, any>;
  const renamed: Record<string, string> = {};

  // map old -> new names
  for (const name of Object.keys(schemas)) {
    renamed[name] = `${prefix}_${name}`;
  }

  // rename schema keys
  const newSchemas: Record<string, any> = {};
  for (const [oldName, schema] of Object.entries(schemas)) {
    newSchemas[renamed[oldName]] = schema;
  }
  doc.components.schemas = newSchemas;

  // update all $ref "#/components/schemas/Old" occurrences anywhere
  const json = JSON.stringify(doc);
  const replaced = json.replace(
    /"#\/components\/schemas\/([^"]+)"/g,
    (_, schemaName) =>
      `"#/components/schemas/${
        renamed[schemaName] ?? `${prefix}_${schemaName}`
      }"`
  );

  return JSON.parse(replaced);
}

/**
 * Prefix every path with a namespace:
 *   /employees -> /hr/employees
 *   /approval-requests -> /approval/approval-requests
 */
function prefixPaths(doc: OpenAPI, pathPrefix: string) {
  if (!doc.paths) return doc;

  const normalizedPrefix = pathPrefix.startsWith('/')
    ? pathPrefix
    : `/${pathPrefix}`;

  const newPaths: Record<string, any> = {};
  for (const [path, item] of Object.entries<any>(doc.paths)) {
    const newPath = `${normalizedPrefix}${
      path.startsWith('/') ? path : `/${path}`
    }`;
    newPaths[newPath] = item;
  }

  doc.paths = newPaths;
  return doc;
}

/**
 * Prefix operationIds to avoid collisions in generated clients:
 *   create -> HR_create
 *   ApprovalRequestController_create -> APPROVAL_ApprovalRequestController_create
 */
function prefixOperationIds(doc: OpenAPI, prefix: string) {
  if (!doc.paths) return doc;

  for (const pathItem of Object.values<any>(doc.paths)) {
    for (const method of Object.keys(pathItem)) {
      const op = pathItem[method];
      if (op && typeof op === 'object' && typeof op.operationId === 'string') {
        op.operationId = `${prefix}_${op.operationId}`;
      }
    }
  }

  return doc;
}

function mergeOpenApi(hr: OpenAPI, approval: OpenAPI): OpenAPI {
  return {
    openapi: '3.0.0',
    info: {
      title: 'IMMS Aggregated API',
      version: '1.0.0',
      description: 'Aggregated OpenAPI for frontend client generation',
    },
    // ONE base server (this should be your gateway/base url)
    servers: [
      {
        url: 'http://localhost:4700',
        description: 'Local (single base URL; paths are namespaced)',
      },
    ],
    tags: [...(hr.tags ?? []), ...(approval.tags ?? [])],
    paths: {
      ...(hr.paths ?? {}),
      ...(approval.paths ?? {}),
    },
    components: {
      schemas: {
        ...(hr.components?.schemas ?? {}),
        ...(approval.components?.schemas ?? {}),
      },
      parameters: {
        ...(hr.components?.parameters ?? {}),
        ...(approval.components?.parameters ?? {}),
      },
      responses: {
        ...(hr.components?.responses ?? {}),
        ...(approval.components?.responses ?? {}),
      },
      securitySchemes: {
        ...(hr.components?.securitySchemes ?? {}),
        ...(approval.components?.securitySchemes ?? {}),
      },
    },
  };
}

async function main() {
  const hr = JSON.parse(await fs.readFile('mergeapi/hr.json', 'utf8'));
  const approval = JSON.parse(
    await fs.readFile('mergeapi/approval.json', 'utf8')
  );

  // HR: schemas + paths + operationIds
  const hrFinal = prefixOperationIds(
    prefixPaths(prefixSchemas(hr, 'HR'), '/hr'),
    'HR'
  );

  // Approval: schemas + paths + operationIds
  const approvalFinal = prefixOperationIds(
    prefixPaths(prefixSchemas(approval, 'APPROVAL'), '/approval'),
    'APPROVAL'
  );

  const merged = mergeOpenApi(hrFinal, approvalFinal);

  await fs.writeFile(
    'openapi-aggregated.json',
    JSON.stringify(merged, null, 2)
  );
  console.log('✅ wrote openapi-aggregated.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
