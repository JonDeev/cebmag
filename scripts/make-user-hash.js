// scripts/make-user-hash.js
const crypto = require("crypto");

function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(plain, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

const usuario = process.argv[2];
const pass = process.argv[3];

if (!usuario || !pass) {
  console.log("Uso: node scripts/make-user-hash.js <usuario> <password>");
  process.exit(1);
}

console.log("usuario:", usuario.toLowerCase());
console.log("hash:", hashPassword(pass));