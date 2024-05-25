/**
 * This class represents the user entity in the database.
 * It contains the fields and decorators for defining the table structure.
 * The table name is "users".
 */
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Task } from "./task.model";
import { RefreshToken } from "./refresh-token.model";

@Entity({ name: "users" })
export class User {
  /**
   * The primary key of the user entity.
   * It is generated automatically and incremented for each new user.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The first name of the user.
   */
  @Column({ name: "first_name" })
  firstName: string;

  /**
   * The last name of the user.
   */
  @Column({ name: "last_name" })
  lastName: string;

  /**
   * The email of the user.
   * It must be unique to avoid duplicate emails.
   */
  @Column({ name: "email", unique: true })
  email: string;

  /**
   * The hashed password of the user.
   */
  @Column()
  password: string;

  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  /**
   * The date and time when the user's email is verified.
   * It can be null if the email is not verified yet.
   */
  @Column({ name: "email_verified_at", nullable: true })
  emailVerifiedAt: Date;
}
