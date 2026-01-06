import { Level } from '../enums/level.enum';
import { TeamMember } from '../interfaces/team-member.interface';
import { LEVEL_JUNIOR, LEVEL_MEDIOR, LEVEL_SENIOR } from './level.const';

export const TEAM_LENDING = 'SLS';
export const TEAM_FUNDING = 'DS';

export const teamMembers: TeamMember[] = [
  {
    name: 'Lekha',
    id: '615ac0fda707100069885ad5',
    email: 'lekha.sholehati@amarbank.co.id',
    team: [TEAM_FUNDING, TEAM_LENDING],
    level: Level[LEVEL_JUNIOR],
  },
  {
    name: 'Tasrifin',
    id: '712020:1d6d1b04-9241-4007-8159-cf44b72ba81f',
    email: 'tasrifin@amarbank.co.id',
    team: [TEAM_LENDING],
    level: Level[LEVEL_MEDIOR],
  },
  {
    name: 'Luqman',
    id: '712020:2fe52388-cf5e-4930-be5f-58495306745f',
    email: 'luqman.nugroho@amarbank.co.id',
    team: [TEAM_LENDING],
    level: Level[LEVEL_SENIOR],
  },
  {
    name: 'Arijona',
    id: '712020:9e3d1692-d17e-4f3b-a99d-1338acf61c9a',
    email: 'arijona.purba@amarbank.co.id',
    team: [TEAM_LENDING],
    level: Level[LEVEL_JUNIOR],
  },
  {
    name: 'Irvandy',
    id: '712020:6a8b3a76-88aa-44f2-b2db-43e254f9af7a',
    email: 'irvandy.hartono@amarbank.co.id',
    team: [TEAM_FUNDING, TEAM_LENDING],
    level: Level[LEVEL_MEDIOR],
  },
  {
    name: 'Rahmad',
    id: '712020:0b37a477-f775-4c05-af72-0c82164b5af5',
    email: 'rahmad.hidayat@amarbank.co.id',
    team: [TEAM_LENDING],
    level: Level[LEVEL_SENIOR],
  },
  {
    name: 'Echa',
    id: '5d026d1b906a670bc885315f',
    email: 'tryse.rezza@amarbank.co.id',
    team: [TEAM_LENDING],
    level: Level[LEVEL_SENIOR],
  },
  {
    name: 'Nurul',
    id: '712020:7e4ff2fd-a621-4fee-a335-3fa34b326d4b',
    email: 'nurul.septariani@amarbank.co.id',
    team: [TEAM_LENDING],
    level: Level[LEVEL_SENIOR],
  },
  {
    name: 'Dito',
    id: '712020:d2aade81-3e28-4c7a-90d3-3ad95b6934e6',
    email: 'dito.laksono@amarbank.co.id',
    team: [TEAM_FUNDING, TEAM_LENDING],
    level: Level[LEVEL_SENIOR],
  },
  {
    name: 'Yahya',
    id: '712020:74d82569-f85e-46f4-ac4a-5ace36807b9d',
    email: 'yahya.hafidz@amarbank.co.id',
    team: [TEAM_LENDING],
    level: Level[LEVEL_JUNIOR],
  },
  {
    name: 'Fharied',
    id: '712020:28255331-6dec-4ea0-a265-63d25b51a0aa',
    email: 'fharied.fhaturrachman@amarbank.co.id',
    team: [TEAM_LENDING],
    level: Level[LEVEL_MEDIOR],
  },
  {
    name: 'Ruth',
    id: '5f71842b4d09f70076c62854',
    email: 'ruth.hutauruk@amarbank.co.id',
    team: [TEAM_FUNDING],
    level: Level[LEVEL_MEDIOR],
  },
  {
    name: 'Mike',
    id: '61b9796540142900700ef16f',
    email: 'michael.william@amarbank.co.id',
    team: [TEAM_FUNDING],
    level: Level[LEVEL_JUNIOR],
  },
  {
    name: 'Dala',
    id: '712020:09ee5848-15cf-4072-9649-16ca57be8492',
    email: 'iketut.cahyoga@amarbank.co.id',
    team: [TEAM_FUNDING],
    level: Level[LEVEL_JUNIOR],
  },
  {
    name: 'Tara',
    id: '5ed5fc5c8063980c18eee63c',
    email: 'tara.desyafriben@amarbank.co.id',
    team: [TEAM_FUNDING, TEAM_LENDING],
    level: Level[LEVEL_SENIOR],
  },
  {
    name: 'Tommy',
    id: '5ba1c3290b4e302eb612ec62',
    email: 'tommy.putranto@amarbank.co.id',
    team: [TEAM_FUNDING],
    level: Level[LEVEL_SENIOR],
  },
];
