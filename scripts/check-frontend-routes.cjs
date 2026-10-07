// Read-only smoke checks against an already running production frontend.
const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:3010';
const pages = ['/', '/car', '/car/detail?id=invalid', '/kr/car', '/ru/car',
 '/mypage?category=myCars', '/member?memberId=000000000000000000000001',
 '/account/join', '/community', '/_admin/cars', '/_admin/brands',
 '/img/car/hero.svg', '/img/car/placeholder.svg'];
const redirects = [
 ['/property?input=%7B%7D', '/car?input=%7B%7D'],
 ['/kr/property/detail?id=abc', '/kr/car/detail?id=abc'],
 ['/ru/_admin/properties?page=2', '/ru/_admin/cars?page=2'],
];
async function main() {
 for (const path of pages) {
  const response = await fetch(origin + path, { redirect: 'manual' });
  if (response.status !== 200) throw new Error(`${path}: expected 200, got ${response.status}`);
  console.log(`200 ${path}`);
 }
 for (const [path, destination] of redirects) {
  const response = await fetch(origin + path, { redirect: 'manual' });
  const location = new URL(response.headers.get('location') || '/', origin);
  if (response.status !== 308 || location.pathname + location.search !== destination)
   throw new Error(`${path}: expected 308 ${destination}, got ${response.status} ${location.pathname}${location.search}`);
  console.log(`308 ${path} -> ${destination}`);
 }
 console.log('Frontend HTTP routes and locale/query-preserving redirects passed.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
