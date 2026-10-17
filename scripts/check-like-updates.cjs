// Offline integration: use real Apollo mutation/cache behavior without touching production records.
const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');
const ts = require('typescript');
const apollo = require('@apollo/client');
const context = { exports: {}, require: () => apollo };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('apollo/cache.ts', 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText, context);
const { createApolloCache, updateLikeCache } = context.exports;
const { ApolloClient, ApolloLink, Observable, gql } = apollo;
(async () => {
 for (const [type, operation, count] of [['Car', 'likeTargetCar', 'carLikes'], ['Member', 'likeTargetMember', 'memberLikes'], ['BoardArticle', 'likeTargetBoardArticle', 'articleLikes']]) {
  const query = gql`query Cards { cards { _id name ${count} image meLiked { memberId likeRefId myFavorite } brandData { _id name } } }`;
  const mutation = gql`mutation Like($input:String!) { ${operation}(input:$input) { _id ${count} name image brandData { _id name } } }`;
  const record = id => ({ __typename: type, _id: id, name: 'Original name', image: '/original.jpg', [count]: 2, meLiked: [], brandData: { __typename: 'Brand', _id: 'brand', name: 'Original brand' } });
  const cache = createApolloCache();
  cache.writeQuery({ query, data: { cards: [record('target'), record('other')] } });
  let requests = 0, fail = false, viewer = 'viewer';
  const client = new ApolloClient({ cache, defaultOptions: { mutate: { update: (cache, result) => updateLikeCache(cache, result, viewer) } }, link: new ApolloLink(() => {
   requests++;
   return fail ? new Observable(observer => observer.error(new Error('Offline'))) : Observable.of({ data: { [operation]: { __typename: type, _id: 'target', [count]: requests === 1 ? 3 : 2, name: null, image: null, brandData: null } } });
  }) });
  const before = cache.readQuery({ query });
  await client.mutate({ mutation, variables: { input: 'target' }, fetchPolicy: 'no-cache' });
  let result = cache.readQuery({ query });
  assert.equal(result.cards[0][count], 3);
  assert.equal(result.cards[0].meLiked[0].myFavorite, true);
  assert.equal(result.cards[0].meLiked[0].memberId, 'viewer');
  assert.equal(result.cards[0].name, 'Original name');
  assert.equal(result.cards[0].image, '/original.jpg');
  assert.equal(result.cards[0].brandData.name, 'Original brand');
  assert.equal(result.cards[1], before.cards[1], 'Unchanged cards keep their cache reference');
  await client.mutate({ mutation, variables: { input: 'target' }, fetchPolicy: 'no-cache' });
  result = cache.readQuery({ query });
  assert.equal(result.cards[0][count], 2);
  assert.equal(result.cards[0].meLiked[0].myFavorite, false);
  const stable = cache.extract();
  fail = true;
  await assert.rejects(client.mutate({ mutation, variables: { input: 'target' }, fetchPolicy: 'no-cache' }));
  assert.deepEqual(cache.extract(), stable, 'Errors leave the UI state unchanged');
  assert.equal(requests, 3, 'Only mutations run; there is no listing refetch');
  viewer = '';
  updateLikeCache(cache, { data: { [operation]: { _id: 'target', [count]: 99 } } }, viewer);
  assert.deepEqual(cache.extract(), stable, 'Anonymous results cannot update personalized cache');
  client.stop();
 }
 console.log('Like updates passed: Car/Member/Article, like/unlike, preserved names/images/joins/order, stable unrelated cards, failure and guest safety, no list refetch.');
})().catch(error => { console.error(error); process.exitCode = 1; });
