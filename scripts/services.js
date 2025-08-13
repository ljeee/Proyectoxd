export async function getClanes() {
  const res = await fetch("http://localhost:3000/clanes");
  const data = await res.json();
  return data;
}