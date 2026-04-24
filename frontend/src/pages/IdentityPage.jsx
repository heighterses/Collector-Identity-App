import { useEffect, useState, useRef, useCallback } from "react";
import TraitList from "../components/identity/TraitList";
import Snackbar from "../components/identity/Snackbar";

function IdentityPage({ artworkId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!artworkId) return;
    const token = localStorage.getItem("authToken");

    fetch(`/api/identity/template/${artworkId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [artworkId]);

  const handleUpdate = async (traitId, updates) => {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`/api/identity/trait/${traitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updated = await res.json();
      setData(prev => ({
        ...prev,
        traits: prev.traits.map(t => t.id === traitId ? { ...t, ...updated } : t)
      }));
    }
  };

  const handleSaveVersion = async () => {
    if (savingRef.current || !data?.template_id) return;
    savingRef.current = true;

    const token = localStorage.getItem("authToken");
    const res = await fetch(`/api/identity/version/save/${data.template_id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const result = await res.json();
      setShowSnackbar(false);
      setTimeout(() => {
        setSavedAt(result.version?.created_at || new Date().toISOString());
        setShowSnackbar(true);
      }, 10);
    }
    savingRef.current = false;
  };

  const handleSnackbarClose = useCallback(() => setShowSnackbar(false), []);

  if (loading) return <div>Loading...</div>;

  if (!data || !data.traits || data.traits.length === 0)
    return <div>No identity template found.</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Identity</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleSaveVersion}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1c1917",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Save Version
          </button>
        </div>
      </div>
      <TraitList traits={data.traits} onUpdate={handleUpdate} />
      {showSnackbar && (
        <Snackbar
          message="Version saved"
          timestamp={savedAt}
          onClose={handleSnackbarClose}
        />
      )}
    </div>
  );
}

export default IdentityPage;
