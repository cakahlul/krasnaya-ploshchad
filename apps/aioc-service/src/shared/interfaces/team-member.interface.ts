import { Level } from '../enums/level.enum';

export interface TeamMember {
  name: string;
  id: string;
  email: string;
  team: string[];
  level: Level;
}
