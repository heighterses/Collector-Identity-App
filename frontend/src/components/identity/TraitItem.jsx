import SliderDisplay from "./SliderDisplay";
import ChipDisplay from "./ChipDisplay";
import TextDisplay from "./TextDisplay";
import ConfirmSwitch from "./ConfirmSwitch";

function TraitItem({ trait, onUpdate }) {
  const renderTrait = () => {
    switch (trait.type) {
      case "slider":
        return <SliderDisplay trait={trait} onUpdate={onUpdate} />;
      case "chip":
        return <ChipDisplay trait={trait} onUpdate={onUpdate} />;
      case "text":
        return <TextDisplay trait={trait} onUpdate={onUpdate} />;
      default:
        return null;
    }
  };

  return (
    <div className="trait-item-row">
      <div style={{ flex: 1, minWidth: 0 }}>{renderTrait()}</div>
      <ConfirmSwitch trait={trait} onUpdate={onUpdate} />
    </div>
  );
}

export default TraitItem;
