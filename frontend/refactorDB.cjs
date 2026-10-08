const fs = require('fs');
let content = fs.readFileSync('src/lib/gameDatabase.ts', 'utf8');

// 1. Add in-memory caches at the top
const cacheDeclarations = `
let cachedRooms: RoomRecord[] = [];
let cachedTeams: Team[] = [];
let cachedStaff: AdminUser[] = [];
let cachedPowers: ImpostorPowerPort[] = [];
let cachedLogs: ActivityLogItem[] = [];
let cachedGamePoints: GamePointsConfig = { ...DEFAULT_GAME_POINTS };
let isLoaded = false;
`;
content = content.replace('export const AllocationDatabase = {', cacheDeclarations + '\nexport const AllocationDatabase = {');

// 2. Replace getRooms
content = content.replace(/getRooms\(\): RoomRecord\[\] \{[^]*?return INITIAL_ROOMS;\s*\}/, 'getRooms(): RoomRecord[] { return cachedRooms; }');

// 3. Replace saveRooms
content = content.replace(/saveRooms\(rooms: RoomRecord\[\]\): void \{[^]*?syncRoomsToSupabase\(rooms\)\.catch\(\(\) => \{\}\);\s*\}/, 'saveRooms(rooms: RoomRecord[]): void { cachedRooms = rooms; syncRoomsToSupabase(rooms).catch(() => {}); }');

// 4. Replace getTeams
content = content.replace(/getTeams\(\): Team\[\] \{[^]*?return initialized;\s*\}/, 'getTeams(): Team[] { return cachedTeams; }');

// 5. Replace saveTeams
content = content.replace(/saveTeams\(teams: Team\[\]\): void \{[^]*?syncTeamsToSupabase\(teams\)\.catch\(\(\) => \{\}\);\s*\}/, 'saveTeams(teams: Team[]): void { cachedTeams = teams; syncTeamsToSupabase(teams).catch(() => {}); }');

// 6. Replace getStaffUsers
content = content.replace(/getStaffUsers\(\): AdminUser\[\] \{[^]*?return INITIAL_STAFF_USERS;\s*\}/, 'getStaffUsers(): AdminUser[] { return cachedStaff; }');

// 7. Replace saveStaffUsers
content = content.replace(/saveStaffUsers\(users: AdminUser\[\]\): void \{[^]*?syncStaffToSupabase\(finalUsers\)\.catch\(\(\) => \{\}\);\s*\}/, 'saveStaffUsers(users: AdminUser[]): void { const finalUsers = [...users]; const rootAccount = cachedStaff.find(u => isRootMasterAccount(u)); if (rootAccount && !finalUsers.some(u => isRootMasterAccount(u))) { finalUsers.unshift(rootAccount); } cachedStaff = finalUsers; syncStaffToSupabase(finalUsers).catch(() => {}); }');

// 8. Replace getPowerLibrary
content = content.replace(/getPowerLibrary\(\): ImpostorPowerPort\[\] \{[^]*?return STANDARD_POWER_LIBRARY;\s*\}/, 'getPowerLibrary(): ImpostorPowerPort[] { return cachedPowers; }');

// 9. Replace savePowerLibrary
content = content.replace(/savePowerLibrary\(powers: ImpostorPowerPort\[\]\): void \{[^]*?syncPowersToSupabase\(powers\)\.catch\(\(\) => \{\}\);\s*\}/, 'savePowerLibrary(powers: ImpostorPowerPort[]): void { cachedPowers = powers; syncPowersToSupabase(powers).catch(() => {}); }');

// 10. Replace getGamePointsConfig
content = content.replace(/getGamePointsConfig\(\): GamePointsConfig \{[^]*?return \{ \.\.\.DEFAULT_GAME_POINTS \};\s*\}/, 'getGamePointsConfig(): GamePointsConfig { return cachedGamePoints; }');

// 11. Replace saveGamePointsConfig
content = content.replace(/saveGamePointsConfig\(config: GamePointsConfig\): void \{[^]*?catch \(e\) \{.*?\}\s*\}/s, 'saveGamePointsConfig(config: GamePointsConfig): void { cachedGamePoints = config; /* add supabase sync here if needed */ }');

// 12. Replace getLogs
content = content.replace(/getActivityLogs\(\): ActivityLogItem\[\] \{[^]*?return INITIAL_ACTIVITY_LOGS;\s*\}/, 'getActivityLogs(): ActivityLogItem[] { return cachedLogs; }');

// 13. Replace saveLogs
content = content.replace(/saveActivityLogs\(logs: ActivityLogItem\[\]\): void \{[^]*?catch \(e\) \{.*?\}\s*\}/s, 'saveActivityLogs(logs: ActivityLogItem[]): void { cachedLogs = logs; }');

// 14. Fix syncFromSupabase to use cache and export it
content = content.replace('async syncFromSupabase()', 'syncFromSupabase: async function()');
content = content.replace(/localStorage\.setItem\(ROOMS_STORAGE_KEY, JSON\.stringify\(mappedRooms\)\);/g, 'cachedRooms = mappedRooms;');
content = content.replace(/localStorage\.setItem\(TEAMS_STORAGE_KEY, JSON\.stringify\(mappedTeams\)\);/g, 'cachedTeams = mappedTeams;');
content = content.replace(/localStorage\.setItem\(STAFF_STORAGE_KEY, JSON\.stringify\(sanitizedStaff\)\);/g, 'cachedStaff = sanitizedStaff;');
content = content.replace(/localStorage\.setItem\(POWERS_STORAGE_KEY, JSON\.stringify\(mappedPowers\)\);/g, 'cachedPowers = mappedPowers;');

// 15. Export load/init status
content = content.replace('export const AllocationDatabase = {', 'export const AllocationDatabase = {\n  isLoaded: () => isLoaded,\n  setLoaded: (val: boolean) => { isLoaded = val; },');

fs.writeFileSync('src/lib/gameDatabase.ts', content);
console.log("Refactored gameDatabase.ts");
