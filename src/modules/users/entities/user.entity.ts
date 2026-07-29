import {
  BeforeInsert,
  BeforeUpdate,
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VisibilidadPerfil } from '../enums/social.enums';

// import { VisibilidadPerfil } from '../enums/social.enums';
// import { Amistad } from './amistad.entity';
// import { ChatParticipante } from './chat-participante.entity';
// import { Comentario } from './comentario.entity';
// import { LikeComentario } from './like-comentario.entity';
// import { LikePublicacion } from './like-publicacion.entity';
// import { Publicacion } from './publicacion.entity';
// import { SolicitudAmistad } from './solicitud-amistad.entity';

@Entity({ name: 'usuarios' })
@Index('uq_usuarios_correo', ['correo'], { unique: true })
@Index('uq_usuarios_username', ['username'], { unique: true })
@Check('chk_usuarios_correo_minusculas', '"correo" = lower("correo")')
@Check('chk_usuarios_username_minusculas', '"username" = lower("username")')
export class Usuario {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id_usuario',
  })
  id!: string;

  @Column({
    type: 'varchar',
    length: 254,
  })
  correo!: string;

  @Column({
    type: 'varchar',
    length: 30,
  })
  username!: string;

  @Column({
    type: 'varchar',
    length: 80,
  })
  nombre!: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash!: string;

  @Column({
    name: 'is_verified',
    type: 'boolean',
    default: false,
  })
  isVerified!: boolean;

  @Column({
    name: 'verification_token',
    type: 'text',
    nullable: true,
  })
  verificationToken!: string | null;

  @Column({
    name: 'verification_token_expires_at',
    type: 'timestamp',
    precision: 3,
    nullable: true,
  })
  verificationTokenExpiresAt!: Date | null;

  @Column({
    name: 'reset_token',
    type: 'text',
    nullable: true,
  })
  resetToken!: string | null;

  @Column({
    name: 'reset_token_expires_at',
    type: 'timestamp',
    precision: 3,
    nullable: true,
  })
  resetTokenExpiresAt!: Date | null;

  @Column({
    name: 'refresh_token_hash',
    type: 'text',
    nullable: true,
  })
  refreshTokenHash!: string | null;

  @Column({
    type: 'varchar',
    length: 280,
    nullable: true,
  })
  descripcion!: string | null;

  @Column({
    name: 'visibilidad',
    type: 'enum',
    enum: VisibilidadPerfil,
    enumName: 'visibilidad_perfil_enum',
    default: VisibilidadPerfil.PUBLICO,
  })
  visibilidad!: VisibilidadPerfil;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    precision: 3,
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    precision: 3,
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    precision: 3,
    nullable: true,
  })
  deletedAt!: Date | null;

//   @OneToMany(
//     () => Publicacion,
//     (publicacion) => publicacion.usuario,
//   )
//   publicaciones!: Publicacion[];

//   @OneToMany(
//     () => Comentario,
//     (comentario) => comentario.usuario,
//   )
//   comentarios!: Comentario[];

//   @OneToMany(
//     () => LikePublicacion,
//     (like) => like.usuario,
//   )
//   likesPublicaciones!: LikePublicacion[];

//   @OneToMany(
//     () => LikeComentario,
//     (like) => like.usuario,
//   )
//   likesComentarios!: LikeComentario[];

//   @OneToMany(
//     () => SolicitudAmistad,
//     (solicitud) => solicitud.usuario1,
//   )
//   solicitudesComoUsuario1!: SolicitudAmistad[];

//   @OneToMany(
//     () => SolicitudAmistad,
//     (solicitud) => solicitud.usuario2,
//   )
//   solicitudesComoUsuario2!: SolicitudAmistad[];

//   @OneToMany(
//     () => SolicitudAmistad,
//     (solicitud) => solicitud.solicitante,
//   )
//   solicitudesEnviadas!: SolicitudAmistad[];

//   @OneToMany(
//     () => Amistad,
//     (amistad) => amistad.usuario1,
//   )
//   amistadesComoUsuario1!: Amistad[];

//   @OneToMany(
//     () => Amistad,
//     (amistad) => amistad.usuario2,
//   )
//   amistadesComoUsuario2!: Amistad[];

//   @OneToMany(
//     () => ChatParticipante,
//     (participante) => participante.usuario,
//   )
//   participacionesChat!: ChatParticipante[];

  @BeforeInsert()
  @BeforeUpdate()
  normalizarDatosUnicos(): void {
    if (this.correo) {
      this.correo = this.correo.trim().toLowerCase();
    }

    if (this.username) {
      this.username = this.username.trim().toLowerCase();
    }

    if (this.nombre) {
      this.nombre = this.nombre.trim();
    }

    if (this.descripcion) {
      this.descripcion = this.descripcion.trim();
    }
  }
}
