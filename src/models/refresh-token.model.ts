import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./user.model";

/**
 * This class represents the refresh token entity in the database.
 * It contains the fields and decorators for defining the table structure.
 * The table name is "refresh_tokens".
 */

@Entity()
export class RefreshToken {
  /**
   * The primary key of the refresh token. It is an auto-incrementing integer.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The token of the refresh token.
   */
  @Column()
  token: string;

  /**
   * The user who owns the refresh token.
   */
  @ManyToOne(() => User, (user) => user.refreshTokens)
  user: User;

  /**
   * The date and time when the refresh token expires.
   */
  @Column({ name: "expired_at" })
  expiredAt: Date;

  /**
   * The date and time when the refresh token was created.
   */
  @Column({ name: "created_at" })
  createdAt: Date;
}

