import Label from "./types/label";
import Actor from "./types/actor";

// Returns IDs of extracted labels
export function extractLabels(str: string): string[] {
  str = str.toLowerCase();
  const foundLabels = [] as string[];
  Label.getAll()
    .forEach(label => {
      if (str.includes(label.name.toLowerCase())) {
        foundLabels.push(label.id);
      }
      else if (label.aliases.some(alias => str.includes(alias.toLowerCase()))) {
        foundLabels.push(label.id);
      }
    })
  return foundLabels;
}

// Returns IDs of extracted actors
export function extractActors(str: string): string[] {
  str = str.toLowerCase();
  const foundActors = [] as string[];
  Actor.getAll()
    .forEach(actor => {
      if (str.includes(actor.name.toLowerCase())) {
        foundActors.push(actor.id);
      }
      else if (actor.aliases.some(alias => str.includes(alias.toLowerCase()))) {
        foundActors.push(actor.id);
      }
    })
  return foundActors;
}
