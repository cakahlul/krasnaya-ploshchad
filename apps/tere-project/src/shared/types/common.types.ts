export enum Level {
  Junior = 'junior',
  Medior = 'medior',
  Senior = 'senior',
  IC = 'individual contributor',
}

export interface TeamMember {
  name: string;
  id: string;
  email: string;
  team: string[];
  level: Level;
  fullName: string;
}
