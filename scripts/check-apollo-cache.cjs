// Real Apollo cache and Next-style console formatting; no server or accounts.
const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');
const ts = require('typescript');
const apollo = require('@apollo/client');
const { gql } = apollo;
const context = { exports: {}, require: name => { assert.equal(name, '@apollo/client'); return apollo; } };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('apollo/cache.ts', 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText, context);
const documents = {
 Member: gql`query { getMember { _id memberNick meLiked { memberId likeRefId myFavorite } meFollowed { followingId followerId myFollowing } } }`,
 Car: gql`query { getCar { _id carTitle meLiked { memberId likeRefId myFavorite } } }`,
 BoardArticle: gql`query { getBoardArticle { _id articleTitle meLiked { memberId likeRefId myFavorite } } }`,
};
const fields = { Member: 'getMember', Car: 'getCar', BoardArticle: 'getBoardArticle' };
const response = (type, liked) => ({ [fields[type]]: {
 __typename: type, _id: 'entity',
 ...(type === 'Member' ? { memberNick: 'Agent', meFollowed: liked ? [{ __typename: 'MeFollowed', followingId: 'entity', followerId: 'old-viewer', myFollowing: true }] : [] } : type === 'Car' ? { carTitle: 'Car' } : { articleTitle: 'Article' }),
 meLiked: liked ? [{ __typename: 'MeLiked', memberId: 'old-viewer', likeRefId: 'entity', myFavorite: true }] : [],
} });
const warn = console.warn;
let warnings = 0;
console.warn = (...args) => { warnings++; args.map(String); };
try {
 const before = warnings;
 for (const type of Object.keys(documents)) {
  const cache = context.exports.createApolloCache();
  cache.writeQuery({ query: documents[type], data: response(type, true) });
  cache.writeQuery({ query: documents[type], data: response(type, false) });
  const result = cache.readQuery({ query: documents[type] })[fields[type]];
  assert.deepEqual(result.meLiked, []);
  if (type === 'Member') assert.deepEqual(result.meFollowed, []);
  assert.equal(result._id, 'entity');
  cache.writeQuery({ query: documents[type], data: response(type, true) });
  assert.equal(cache.readQuery({ query: documents[type] })[fields[type]].meLiked[0].myFavorite, true);
 }
 assert.equal(warnings, before);
 console.log('Apollo cache checks passed: viewer likes/follows replace safely across auth changes for Member/Car/BoardArticle without formatting warnings.');
} finally { console.warn = warn; }
