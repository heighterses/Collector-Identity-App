import { useEffect, useState } from "react";
import TraitList from "../components/identity/TraitList";

function IdentityPage({ artworkId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
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

  if (loading) return <div>Loading...</div>;

  if (!data || !data.traits || data.traits.length === 0)
    return <div>No identity template found.</div>;

  return (
    <div>
      <h2>Identity</h2>
      <TraitList traits={data.traits} onUpdate={handleUpdate} />
    </div>
  );
}

export default IdentityPage;
