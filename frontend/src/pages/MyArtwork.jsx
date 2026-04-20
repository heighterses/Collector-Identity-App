import React from 'react';
import { artwork } from '../api';

const MyArtwork = ({ artworks = [], onNavigate, onArtworkDeleted }) => {

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this artwork?")) return;

    try {
      await artwork.deleteMine(id);
      if (onArtworkDeleted) onArtworkDeleted();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  if (!artworks.length) {
    return (
      <div style={{ padding: 20 }}>
        <h2>No artworks yet</h2>
        <button onClick={() => onNavigate('add-artwork')}>
          Add Artwork
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>My Artworks</h1>

      {artworks.map((art) => (
        <div
          key={art.id}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            marginBottom: "15px",
            borderRadius: "10px"
          }}
        >
          <h3>{art.title || "Untitled"}</h3>
          <p>{art.description}</p>

          {art.image_url && (
            <img
              src={art.image_url}
              alt="art"
              style={{ width: "200px", marginTop: "10px" }}
            />
          )}

          <div style={{ marginTop: "10px" }}>
            <button onClick={() => onNavigate('reflection')}>
              View Reflection
            </button>

            <button
              onClick={() => handleDelete(art.id)}
              style={{ marginLeft: "10px" }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyArtwork;