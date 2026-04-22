import TraitItem from "./TraitItem";

function TraitList({ traits, onUpdate }) {
  return (
    <div>
      {traits.map(trait => (
        <TraitItem key={trait.id} trait={trait} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

export default TraitList;
