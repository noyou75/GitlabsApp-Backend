/**
 * Defines a minimal description of a user, which is used by job execution processors to resolve user objects.
 */
export interface JobUserDescriptor {
  id: string;
  type: string;
}
