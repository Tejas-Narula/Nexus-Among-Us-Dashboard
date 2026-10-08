import React from 'react';
import { Team } from '../../types';

export interface ImpostorPower {
  name: string;
  title: string;
  desc: string;
  targetRequired: boolean;
}

export const IMPOSTOR_POWERS: ImpostorPower[] = [
  {
    name: 'Wordle Sabotage',
    title: 'Wordle Sabotage',
    desc: 'Sabotage the Wordle terminal',
    targetRequired: false,
  },
  {
    name: 'Emoji Sabotage',
    title: 'Emoji Sabotage',
    desc: 'Sabotage the Emoji terminal',
    targetRequired: false,
  },
  {
    name: 'MonkeyType Sabotage',
    title: 'MonkeyType Sabotage',
    desc: 'Sabotage the Code Typer terminal',
    targetRequired: false,
  },
  {
    name: 'Pacman Sabotage',
    title: 'Pacman Sabotage',
    desc: 'Sabotage the Pacman terminal',
    targetRequired: false,
  },
];

interface ImposterProps {
  roomName: string;
  targetTeams: Team[];
  selectedTargetId: string;
  toastMessage: string;
  cooldowns: Record<string, number>;
  onSelectTarget: (teamId: string) => void;
  onTriggerPower: (power: ImpostorPower) => void;
}

export default function Imposter({
  roomName,
  targetTeams,
  selectedTargetId,
  toastMessage,
  cooldowns,
  onSelectTarget,
  onTriggerPower,
}: ImposterProps) {
  const isCoolingDown = Object.values(cooldowns).some(seconds => seconds > 0);

  return (
    <>
      <div className="role-banner" id="roleBanner">
        <div className="role-tag role-impostor" id="roleTag">⚡ ROLE: COVERT IMPOSTOR</div>
        <div className="role-desc" id="roleDesc">
          You are the covert Impostor team in {roomName}! Deceive the crewmates, trigger room sabotages on the map.
        </div>
      </div>

      {toastMessage && (
        <div className="toast-feedback" id="actionToast">
          {toastMessage}
        </div>
      )}

      <div className="target-box" style={{ marginBottom: '16px' }}>
        <div className="target-header">
          <span>🎯 Select Target Crewmate Squad:</span>
          <span style={{ color: '#a1a1aa', fontWeight: 'normal', fontSize: '10px' }}>
            {targetTeams.length} Targets in Sector
          </span>
        </div>
        {targetTeams.length > 0 ? (
          <div className="target-chips">
            {targetTeams.map(team => {
              const code = team.teamCode || team.id;
              const isSelected = selectedTargetId === code || selectedTargetId === team.id;
              return (
                <button
                  key={team.id}
                  type="button"
                  className={`target-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectTarget(code)}
                >
                  <span>{team.name}</span>
                  <span style={{ opacity: 0.7 }}>[{code}]</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: '#71717a' }}>
            No active crewmate teams currently detected in sector.
          </div>
        )}
      </div>

      <div className="powers-section" id="powersSection" style={{ padding: 0, background: 'transparent', border: 'none' }}>
        <div className="powers-header" style={{ marginBottom: '10px' }}>
          <span id="powersHeaderTitle">Impostor Sabotage Console</span>
          <span id="cooldownNotice" style={{ color: '#a1a1aa', fontWeight: 'normal' }}>
            {isCoolingDown ? 'Cooldown Active' : 'Ready'}
          </span>
        </div>
        
        <div className="imposter-map-container">
          <button 
            className={`sabotage-btn ${cooldowns['Wordle Sabotage'] ? 'cooldown' : ''}`} 
            style={{ top: '60%', left: '65%' }} // Admin
            onClick={() => onTriggerPower(IMPOSTOR_POWERS[0])}
            disabled={cooldowns['Wordle Sabotage'] > 0}
            title="Wordle Sabotage (Admin)"
          >
            W
          </button>
          
          <button 
            className={`sabotage-btn ${cooldowns['Emoji Sabotage'] ? 'cooldown' : ''}`} 
            style={{ top: '85%', left: '60%' }} // Coms
            onClick={() => onTriggerPower(IMPOSTOR_POWERS[1])}
            disabled={cooldowns['Emoji Sabotage'] > 0}
            title="Emoji Sabotage (Coms)"
          >
            E
          </button>
          
          <button 
            className={`sabotage-btn ${cooldowns['MonkeyType Sabotage'] ? 'cooldown' : ''}`} 
            style={{ top: '40%', left: '65%' }} // O2
            onClick={() => onTriggerPower(IMPOSTOR_POWERS[2])}
            disabled={cooldowns['MonkeyType Sabotage'] > 0}
            title="MonkeyType Sabotage (O2)"
          >
            C
          </button>

          <button 
            className={`sabotage-btn ${cooldowns['Pacman Sabotage'] ? 'cooldown' : ''}`} 
            style={{ top: '15%', left: '50%' }} // Cafeteria
            onClick={() => onTriggerPower(IMPOSTOR_POWERS[3])}
            disabled={cooldowns['Pacman Sabotage'] > 0}
            title="Pacman Sabotage (Cafeteria)"
          >
            P
          </button>
        </div>
      </div>
    </>
  );
}
