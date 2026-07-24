import React, { useState, useEffect } from 'react';
import { auth, identity } from '../api.js';
import ProfilePieCharts from '../components/ProfilePieCharts';
import TimelinePage from './TimelinePage';
import ComparisonPage from './ComparisonPage';

const RoleIcon = ({ role }) => {
  if (role === 'artist') return (
    // Paintbrush
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/>
      <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/>
      <path d="M14.5 17.5 4.5 15"/>
    </svg>
  );
  if (role === 'collector') return (
    // Picture frame
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <rect x="7" y="7" width="10" height="10" rx="1"/>
    </svg>
  );
  if (role === 'enthusiast') return (
    // Star
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
  return null;
};

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

  const formatPattern = (arr) => {
    if (!arr) return [];
    return arr.map(([label, count]) => `${label} (${count})`);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const notify = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3500);
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) { notify('Name cannot be empty', true); return; }
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
    if (!file.type.startsWith('image/')) { notify('Please select an image file', true); return; }
    if (file.size > 2 * 1024 * 1024) { notify('Image must be smaller than 2MB', true); return; }
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

  // ── Loading skeleton ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="profile-page">
        <div className="ghost-cards">
          <div className="ghost-card" style={{ height: 100 }} />
          <div className="ghost-card" style={{ height: 80 }} />
          <div className="ghost-card" style={{ height: 220 }} />
        </div>
      </div>
    );
  }

  const avatarSrc = avatarPreview || currentUser?.avatar_url || null;

  return (
    <div className="profile-page">

      {/* Notifications */}
      {error   && <div className="alert alert-error"   style={{ marginBottom: 'var(--sp-5)' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 'var(--sp-5)' }}>{success}</div>}

      {/* ── CARD 1 — Profile Header ─────────────────────────────── */}
      <div className="pf-card pf-header-card">
        {/* Avatar */}
        <div className="pf-avatar">
          {avatarSrc
            ? <img src={avatarSrc} alt="Avatar" />
            : <span className="pf-avatar-initial">{getInitials(currentUser?.name)}</span>
          }
        </div>

        {/* Name + email */}
        <div className="pf-identity">
          {isEditing ? (
            <div className="pf-name-edit">
              <input
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                autoFocus
              />
              <div className="pf-name-edit-actions">
                <button className="btn btn-primary btn-sm" onClick={handleSaveName}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setIsEditing(false); setDisplayName(currentUser?.name || ''); }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="pf-name-row">
              <h2 className="pf-display-name">{displayName || 'No name set'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(true)}>Edit</button>
            </div>
          )}
          <p className="pf-email">{currentUser?.email}</p>

          {/* Role badge */}
          {currentUser?.user_role && (
            <span className={`pf-role-badge pf-role-badge--${currentUser.user_role}`}>
              <RoleIcon role={currentUser.user_role} />
              {currentUser.user_role.charAt(0).toUpperCase() + currentUser.user_role.slice(1)}
            </span>
          )}

          {currentUser?.provider && (
            <span className="gallery-provider-badge">{currentUser.provider}</span>
          )}
        </div>

        {/* Photo button — right side */}
        <div className="pf-photo-actions">
          {avatarFile && (
            <button className="btn btn-primary btn-sm" onClick={handleAvatarUpload} disabled={isUploading}>
              {isUploading ? 'Uploading…' : 'Save photo'}
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => document.getElementById('avatar-upload').click()}>
            Change photo
          </button>
          <input type="file" id="avatar-upload" onChange={handleAvatarChange} hidden accept="image/*" />
        </div>
      </div>

      {/* ── CARD 2 — Preferences ────────────────────────────────── */}
      <div className="pf-card pf-prefs-card">
        <div className="pf-card-header">
          <h3 className="pf-card-title">Preferences</h3>
        </div>
        <div className="pf-card-body pf-prefs-grid">
          <div className="pref-item">
            <label className="pref-label form-label" htmlFor="pref-language">Language</label>
            <select
              id="pref-language"
              className="settings-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
            </select>
          </div>
          <div className="pref-item">
            <label className="pref-label form-label" htmlFor="pref-timezone">Timezone</label>
            <select
              id="pref-timezone"
              className="settings-select"
              value={timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern (ET)</option>
              <option value="America/Chicago">Central (CT)</option>
              <option value="America/Denver">Mountain (MT)</option>
              <option value="America/Los_Angeles">Pacific (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Europe/Berlin">Berlin (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
              <option value="Australia/Sydney">Sydney (AEST)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── CARD 3 — Your Patterns (AI Identity) ────────────────── */}
      {profileData && (
        <div className="pf-card pf-patterns-card">
          <div className="pf-card-header">
            <h3 className="pf-card-title">Your Patterns</h3>
            <p className="pf-card-desc">Insights derived from your collection</p>
          </div>
          <div className="pf-card-body">

            {/* Charts — constrained width, centered */}
            {profileData.patterns && (
              <div className="pf-charts-wrap">
                <ProfilePieCharts patterns={profileData.patterns} />
              </div>
            )}

            {/* ── Traits chips ── */}
            {profileData.patterns?.traits?.length > 0 && (
              <div className="pf-pattern-block">
                <p className="pf-pattern-block-label">Traits</p>
                <div className="pf-chip-group">
                  {profileData.patterns.traits.map(([label, count], i) => (
                    <span key={i} className="pf-chip">{label} <span className="pf-chip-count">{count}</span></span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Emotions chips ── */}
            {profileData.patterns?.emotions?.length > 0 && (
              <div className="pf-pattern-block">
                <p className="pf-pattern-block-label">Emotions</p>
                <div className="pf-chip-group">
                  {profileData.patterns.emotions.map(([label, count], i) => (
                    <span key={i} className="pf-chip">{label} <span className="pf-chip-count">{count}</span></span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Themes chips ── */}
            {profileData.patterns?.themes?.length > 0 && (
              <div className="pf-pattern-block">
                <p className="pf-pattern-block-label">Themes</p>
                <div className="pf-chip-group">
                  {profileData.patterns.themes.map(([label, count], i) => (
                    <span key={i} className="pf-chip">{label} <span className="pf-chip-count">{count}</span></span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Trend — only shown when there's actual data ── */}
            {(profileData.trend?.new_traits?.length > 0 || profileData.trend?.dropped_traits?.length > 0) && (
              <div className="pf-pattern-block">
                <p className="pf-pattern-block-label">Trend</p>
                <div className="pf-trend-row">
                  {profileData.trend.new_traits?.length > 0 && (
                    <div className="pf-trend-group">
                      <span className="pf-trend-key pf-trend-key--emerging">Emerging</span>
                      <div className="pf-chip-group">
                        {profileData.trend.new_traits.map((t, i) => (
                          <span key={i} className="pf-chip pf-chip--emerging">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profileData.trend.dropped_traits?.length > 0 && (
                    <div className="pf-trend-group">
                      <span className="pf-trend-key pf-trend-key--fading">Fading</span>
                      <div className="pf-chip-group">
                        {profileData.trend.dropped_traits.map((t, i) => (
                          <span key={i} className="pf-chip pf-chip--fading">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Identity Clusters chips ── */}
            {profileData.clusters?.length > 0 && (
              <div className="pf-pattern-block">
                <p className="pf-pattern-block-label">Identity Clusters</p>
                <div className="pf-chip-group">
                  {profileData.clusters.map((c, i) => (
                    <span key={i} className="pf-chip pf-chip--cluster">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ── AI Insights — styled cards ── */}
            {profileData.insights?.length > 0 && (
              <div className="pf-pattern-block">
                <p className="pf-pattern-block-label">AI Insights</p>
                <div className="pf-insights-list">
                  {profileData.insights.map((insight, idx) => (
                    <div key={idx} className="pf-insight-card">
                      <span className="pf-insight-dot" aria-hidden="true" />
                      <span className="pf-insight-text">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Per Artwork — one card per artwork ── */}
            {profileData.identities?.length > 0 && (
              <div className="pf-pattern-block">
                <p className="pf-pattern-block-label">Per Artwork</p>
                <div className="pf-artwork-list">
                  {profileData.identities.map((item) => {
                    // Extract Core Identity text trait
                    const coreIdentity = item.traits.find(
                      t => (t.trait_type === 'text' || t.type === 'text') && t.label === 'Core Identity'
                    );
                    // All other traits (non-core, non-text, or text that isn't Core Identity)
                    const otherTraits = item.traits.filter(t => t !== coreIdentity);
                    const CHIP_LIMIT = 5;
                    const visibleTraits = otherTraits.slice(0, CHIP_LIMIT);
                    const hiddenCount  = otherTraits.length - visibleTraits.length;

                    return (
                      <div key={item.id} className="pf-artwork-card">
                        {/* Artwork title */}
                        <p className="pf-artwork-card-title">
                          {item.title || `Artwork ${item.artwork_id?.slice(0, 8) ?? item.id?.slice(0, 8)}`}
                        </p>

                        {/* Core Identity — highlighted line */}
                        {coreIdentity?.value && (
                          <p className="pf-artwork-core">
                            <span className="pf-artwork-core-key">Core Identity</span>
                            {coreIdentity.value}
                          </p>
                        )}

                        {/* Trait chips — top 5 + overflow */}
                        {visibleTraits.length > 0 && (
                          <div className="pf-chip-group">
                            {visibleTraits.map((t) => (
                              <span key={t.id} className="pf-chip">
                                {t.label}
                                {t.value && t.value !== 'true' && t.value !== 'false'
                                  ? <span className="pf-chip-count">{parseFloat(t.value) % 1 !== 0 ? parseFloat(t.value).toFixed(1) : t.value}</span>
                                  : null}
                              </span>
                            ))}
                            {hiddenCount > 0 && (
                              <span className="pf-chip-overflow">+{hiddenCount} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Timeline — moved here from the sidebar nav ──────────── */}
      <div className="pf-section">
        <p className="pattern-eyebrow pf-section-eyebrow">Timeline</p>
        <TimelinePage />
      </div>

      {/* ── Compare — moved here from the sidebar nav ───────────── */}
      <div className="pf-section">
        <p className="pattern-eyebrow pf-section-eyebrow">Compare</p>
        <ComparisonPage />
      </div>

    </div>
  );
};

export default Profile;
