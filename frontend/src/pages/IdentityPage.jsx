import { useEffect, useState, useRef } from "react";
import TraitList from "../components/identity/TraitList";

function IdentityPage({ artworkId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
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
      setSaveMsg("Version saved");
      setTimeout(() => setSaveMsg(""), 3000);
    }
    savingRef.current = false;
  };

  if (loading) return <div>Loading...</div>;

  if (!data || !data.traits || data.traits.length === 0)
    return <div>No identity template found.</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Identity</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saveMsg && <span style={{ fontSize: 13, color: "#16a34a" }}>{saveMsg}</span>}
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
    </div>
  );
}

export default IdentityPage;
