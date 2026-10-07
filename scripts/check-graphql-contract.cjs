const fs = require('fs');
const ts = require('typescript');
const assert = require('assert/strict');
const path = require('path');
const { getIntrospectionQuery, buildClientSchema, validate, parse, Kind } = require('graphql');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText, filename);
async function main() {
 const endpoint = process.env.REACT_APP_API_GRAPHQL_URL || 'http://localhost:3007/graphql';
 const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: getIntrospectionQuery() }), signal: AbortSignal.timeout(15000) });
 const result = await response.json();
 if (!response.ok || result.errors) throw new Error(JSON.stringify(result.errors || result));
 const schema = buildClientSchema(result.data);
 for (const file of ['car', 'brand', 'member', 'common', 'comment', 'like', 'view', 'notification', 'board-article']) {
  for (const [name, values] of Object.entries(require('../libs/enums/' + file + '.enum.ts'))) {
   const backend = schema.getType(name);
   if (!backend?.getValues) continue;
   assert.deepEqual(Object.values(values).sort(), backend.getValues().map(value => value.name).sort(), 'Backend enum mismatch: ' + name);
  }
 }
 let count = 0;
 for (const file of ['../apollo/user/query.ts', '../apollo/user/mutation.ts', '../apollo/admin/query.ts', '../apollo/admin/mutation.ts']) {
  for (const [name, document] of Object.entries(require(file))) {
   if (!document.definitions.some(definition => definition.kind === Kind.OPERATION_DEFINITION)) continue;
   const errors = validate(schema, document);
   if (errors.length) throw new Error(name + ': ' + errors.map(error => error.message).join('; '));
   count++;
  }
 }
 let uploads = 0;
 for (const file of ['libs/components/community/Teditor.tsx', 'libs/components/mypage/MyProfile.tsx', 'libs/components/mypage/AddNewCar.tsx']) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function inspect(node) {
   if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'query' &&
    (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer))) {
    const document = parse(node.initializer.text);
    const errors = validate(schema, document);
    if (errors.length) throw new Error(file + ': ' + errors.map(error => error.message).join('; '));
    uploads++;
   }
   ts.forEachChild(node, inspect);
  }
  inspect(source);
 }
 assert.equal(uploads, 3, 'Expected all three existing upload documents');
 console.log(`Validated ${count} frontend operations, ${uploads} inline upload documents, and registered enums against ${endpoint}.`);
}
main().catch(error => { console.error('GraphQL contract verification failed:', error.message); process.exitCode = 1; });
