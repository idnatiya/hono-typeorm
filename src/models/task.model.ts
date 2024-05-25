import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.model";

/**
 * This class represents the task entity in the database.
 * It contains the fields and decorators for defining the table structure.
 * The table name is "tasks".
 */
@Entity({ name: "tasks" })
export class Task {
  /**
   * The primary generated column for the task entity.
   * It is of type number and is the primary key.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The title of the task.
   * It is of type string.
   */
  @Column()
  title: string;

  /**
   * The description of the task.
   * It is of type string.
   */
  @Column()
  description: string;

  /**
   * The completion status of the task.
   * It is of type boolean.
   */
  @Column()
  completed: boolean;

  /**
   * The user associated with the task.
   * It is of type User.
   */
  @ManyToOne(() => User, (user) => user.tasks)
  user: User;

  /**
   * The date and time when the task was created.
   * It is of type Date and is named "created_at".
   */
  @Column({ name: "created_at" })
  createdAt: Date;

  /**
   * The date and time when the task was last updated.
   * It is of type Date and is named "updated_at".
   * It is nullable.
   */
  @Column({ name: "updated_at", nullable: true })
  updatedAt: Date;
}
