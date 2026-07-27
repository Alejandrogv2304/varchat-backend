// src/common/types/authenticated-user.type.ts
import type { Usuario } from 'src/modules/users/entities/user.entity';

export type AuthenticatedUser = Pick<
  Usuario,
  'id' | 'correo' | 'username' | 'nombre' | 'visibilidad'
>;