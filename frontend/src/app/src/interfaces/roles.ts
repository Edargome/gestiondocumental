export const ROLES = {
  ADMIN: 0,
  SUPERVISOR: 1,
  GESTOR: 2,
  EDITOR: 3,
  LECTOR: 4,
} as const;

export const ROLE_OPTIONS: { value: number; label: string }[] = [
  { value: ROLES.ADMIN, label: 'Administrador' },
  { value: ROLES.SUPERVISOR, label: 'Supervisor' },
  { value: ROLES.GESTOR, label: 'Gestor' },
  { value: ROLES.EDITOR, label: 'Editor' },
  { value: ROLES.LECTOR, label: 'Lector' },
];
