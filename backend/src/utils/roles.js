// Escalera de accessLevel ya usada por trash.controller.js y folder.controller.js:
// a menor número, mayor privilegio (0 = admin, seed inicial en init/02_seed.sql).
const ROLES = Object.freeze({
  ADMIN: 0,
  SUPERVISOR: 1,
  GESTOR: 2,
  EDITOR: 3,
  LECTOR: 4,
});

const isAtLeast = (level, required) => level <= required;

module.exports = { ROLES, isAtLeast };
