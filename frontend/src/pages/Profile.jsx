import React, { useState, useEffect } from 'react';
import { auth, identity } from '../api.js';
import ProfilePieCharts from '../components/ProfilePieCharts';

const Profile = ({ currentUser, onLogout, onUserUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 🔥 AI DATA
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.name || '');
      setLanguage(currentUser.language || 'en');
      setTimezone(currentUser.timezone || 'UTC');
    }

    loadIdentityData();

    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, [currentUser]);

  const loadIdentityData = async () => {
    try {
      const res = await identity.getProfileData();
      setProfileData(res);
    } catch (err) {
      console.error("Identity fetch failed:", err);
    }
  };

  // 🔥 HELPER → convert [label, count] → "label (count)"
  const formatPattern = (arr) => {
    if (!arr) return [];
    return arr.map(([label, count]) => `${label} (${count})`);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const notify = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      notify('Name cannot be empty', true);
      return;
    }
    try {
      const r = await auth.updateProfile({ name: displayName.trim() });
      setIsEditing(false);
      notify('Name updated');
      if (onUserUpdate) onUserUpdate(r.user);
    } catch (err) {
      notify(err.message || 'Failed to update name', true);
    }
  };

  const handleLanguageChange = async (val) => {
    try {
      const r = await auth.updateProfile({ language: val });
      setLanguage(val);
      notify('Language updated');
      if (onUserUpdate) onUserUpdate(r.user);
    } catch (err) {
      notify(err.message || 'Failed to update language', true);
    }
  };

  const handleTimezoneChange = async (val) => {
    try {
      const r = await auth.updateProfile({ timezone: val });
      setTimezone(val);
      notify('Timezone updated');
      if (onUserUpdate) onUserUpdate(r.user);
    } catch (err) {
      notify(err.message || 'Failed to update timezone', true);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Please select an image file', true);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify('Image must be smaller than 2MB', true);
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', avatarFile);

      const r = await auth.uploadAvatar(fd);

      notify('Photo updated');

      setAvatarFile(null);
      setAvatarPreview(null);

      if (onUserUpdate) onUserUpdate(r.user);
    } catch (err) {
      notify(err.message || 'Failed to upload photo', true);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="gallery-profile">
        <div className="ghost-cards">
          <div className="ghost-card" style={{ height: 220 }} />
          <div className="ghost-card" style={{ height: 160 }} />
        </div>
      </div>
    );
  }

  const avatarSrc = avatarPreview || currentUser?.avatar_url || null;

  return (
    <div className="gallery-profile">
      <div className="gallery-profile-header">
        <h1 className="gallery-profile-title">Profile</h1>
        <p className="gallery-profile-sub">Your identity and preferences</p>
      </div>

      {/* EXISTING UI */}
      <div className="gallery-identity-card">
        <div className="gallery-identity-banner" />
        <div className="gallery-identity-body">

          <div className="gallery-avatar-row">
            <div className="gallery-avatar">
              {avatarSrc && <img src={avatarSrc} alt="Avatar" />}
              <span>{getInitials(currentUser?.name)}</span>
            </div>

            <button onClick={() => document.getElementById('avatar-upload').click()}>
              Change photo
            </button>

            <input type="file" id="avatar-upload" onChange={handleAvatarChange} hidden />
          </div>

          <h2>{displayName}</h2>
          <p>{currentUser?.email}</p>
        </div>
      </div>

      {/* 🔥 AI IDENTITY */}
      {profileData && (
        <div className="gallery-prefs-card">
          <div className="gallery-prefs-header">
            <h3 className="gallery-prefs-label">AI Identity</h3>
          </div>

          <div className="gallery-prefs-body">

            {/* PATTERNS */}
            {profileData.patterns && (
              <div style={{ marginBottom: "20px" }}>
                <h4>Patterns</h4>

                <p>
                  <strong>Traits:</strong>{" "}
                  {formatPattern(profileData.patterns.traits).join(', ')}
                </p>

                <p>
                  <strong>Emotions:</strong>{" "}
                  {formatPattern(profileData.patterns.emotions).join(', ')}
                </p>

                <p>
                  <strong>Themes:</strong>{" "}
                  {formatPattern(profileData.patterns.themes).join(', ')}
                </p>
                <ProfilePieCharts patterns={profileData.patterns} />
              </div>
            )}

            {/* 🔥 TREND */}
            {profileData.trend && (
              <div style={{ marginBottom: "20px" }}>
                <h4>Trend</h4>

                <p>
                  <strong>New Traits:</strong>{" "}
                  {profileData.trend.new_traits?.join(', ') || '—'}
                </p>

                <p>
                  <strong>Dropped Traits:</strong>{" "}
                  {profileData.trend.dropped_traits?.join(', ') || '—'}
                </p>
              </div>
            )}

            {/* PER ARTWORK */}
            {profileData.identities?.map((item) => (
              <div key={item.id} style={{ marginBottom: "15px" }}>
                <strong>Artwork:</strong> {item.artwork_id}

                <div style={{ marginTop: "5px" }}>
                  {item.traits.map((t) => (
                    <span
                      key={t.id}
                      style={{
                        display: "inline-block",
                        margin: "4px",
                        padding: "4px 8px",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                      }}
                    >
                      {t.label}: {t.value}
                    </span>
                  ))}
                </div>
              </div>
            ))}

          </div>
        </div>
      )}

      {error && <div>{error}</div>}
      {success && <div>{success}</div>}
    </div>
  );
};

export default Profile;