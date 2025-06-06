import React, { useState, useEffect } from 'react';
import './GroupInvitations.css';

const GroupInvitations = ({ userId, onInvitationHandled, groups, fetchUserGroups }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteStatus, setInviteStatus] = useState('');

  const fetchInvitations = async () => {
    try {
      const response = await fetch(
        `https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/UserGroupManagement/get-invites?user_id=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const data = await response.json();
      setInvitations(data.invites);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch invitations');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [userId]);

  const handleInvitation = async (invitationId, accept) => {
    try {
      const response = await fetch(
        'https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/UserGroupManagement/respond-invite',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invitation_id: invitationId,
            accept
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to handle invitation');
      }

      // Remove the handled invitation from the list
      setInvitations(invitations.filter(inv => inv.invitation_id !== invitationId));
      if (onInvitationHandled) {
        onInvitationHandled();
      }
      if(accept){
        fetchUserGroups();
      }
    } catch (err) {
      setError('Failed to handle invitation');
    }
  };

  const handleSendInvite = async () => {
    if (!selectedGroupId) {
      setInviteStatus('Please select a group');
      return;
    }

    setSendingInvite(true);
    setInviteStatus('');

    try {
      const response = await fetch(
        'https://avess5h6lg.execute-api.eu-north-1.amazonaws.com/UserGroupManagement/send-invite',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            group_id: selectedGroupId,
            invited_user_email: inviteEmail,
            invited_by_user_id: userId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send invite');
      }

      setInviteStatus('Invite sent successfully');
      setInviteEmail('');
      setSelectedGroupId('');
    } catch (err) {
      setInviteStatus('Failed to send invite');
    } finally {
      setSendingInvite(false);
    }
  };

  if (loading) return <div className="loading">Loading invitations...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="group-invitations">
      <h2>
        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        Group Invitations
      </h2>

      <div className="send-invite-form">
        <h3>Send Group Invitation</h3>
        <div className="form-group">
          <input
            type="email"
            placeholder="Enter invitee email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="email-input"
          />
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="group-select"
          >
            <option value="">Select a group</option>
            {groups && groups.length > 0 ? (
              groups.map((group) => (
                <option key={group.group_id} value={group.group_id}>
                  {group.group_name || group.name}
                </option>
              ))
            ) : (
              <option value="" disabled>No groups available</option>
            )}
          </select>
        </div>
        <button 
          onClick={handleSendInvite} 
          disabled={sendingInvite || !selectedGroupId || !inviteEmail}
          className="send-invite-button"
        >
          {sendingInvite ? (
            <>
              <span className="spinner"></span>
              Sending...
            </>
          ) : (
            'Send Invite'
          )}
        </button>
        {inviteStatus && (
          <p className={`status-message ${inviteStatus.includes('Failed') ? 'error' : 'success'}`}>
            {inviteStatus}
          </p>
        )}
      </div>
      <div className="invitations-list">
        {invitations.length === 0 ? (
          <div className="no-invitations">
            <p>No pending invitations</p>
          </div>
        ) : (
          invitations.map((invitation) => (
            <div key={invitation.invitation_id} className="invitation-card">
              <div className="invitation-info">
                <h3>{invitation.group_name}</h3>
                <p>Invited by: {invitation.invited_by}</p>
              </div>
              <div className="invitation-actions">
                <button
                  style={{ fontSize: '0.85rem', padding: '2px 10px', minWidth: '60px', height: '28px' }}
                  className="accept-btn small-btn"
                  onClick={() => handleInvitation(invitation.invitation_id, true)}
                >
                  Accept
                </button>
                <button
                  style={{ fontSize: '0.85rem', padding: '2px 10px', minWidth: '60px', height: '28px' }}
                  className="decline-btn small-btn"
                  onClick={() => handleInvitation(invitation.invitation_id, false)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupInvitations; 