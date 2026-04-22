function TextDisplay({ trait }) {
  return (
    <div>
      <strong>{trait.label}</strong>: {trait.value}
    </div>
  );
}

export default TextDisplay;
