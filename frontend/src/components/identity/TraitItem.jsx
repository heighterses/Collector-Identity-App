import SliderDisplay from "./SliderDisplay";
import ChipDisplay from "./ChipDisplay";
import TextDisplay from "./TextDisplay";

function TraitItem({ trait, onUpdate }) {
  switch (trait.type) {
    case "slider":
      return <SliderDisplay trait={trait} onUpdate={onUpdate} />;
    case "chip":
      return <ChipDisplay trait={trait} onUpdate={onUpdate} />;
    case "text":
      return <TextDisplay trait={trait} />;
    default:
      return null;
  }
}

export default TraitItem;
