import Label from "./types/label";
import Actor from "./types/actor";

// Calculate token permutation in string
// "a test string"
// -> ["a", "test", "string", "a test", "test string", "a test string"]
function tokenPerms(str: string) {
  const tokens = str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9']/g, " ")
    .split(" ")
    .filter(Boolean);
  const perms = [...tokens];

  if (tokens.length <= 1) return perms;

  for (let len = 2; len <= tokens.length; len++) {
    for (let i = 0; i <= tokens.length - len; i++) {
      const cat = [] as string[];
      for (let j = 0; j < len; j++) {
        cat.push(tokens[i + j]);
      }
      perms.push(cat.join(" "));
    }
  }

  return perms;
}

// Returns IDs of extracted labels
export async function extractLabels(str: string) {
  const perms = tokenPerms(str);

  const foundLabels = [] as string[];
  const allLabels = await Label.getAll();

  allLabels.forEach(label => {
    if (perms.includes(label.name.toLowerCase())) {
      foundLabels.push(label._id);
    } else if (
      label.aliases.some(alias => perms.includes(alias.toLowerCase()))
    ) {
      foundLabels.push(label._id);
    }
  });
  return foundLabels;
}

// Returns IDs of extracted actors
export async function extractActors(str: string) {
  const perms = tokenPerms(str);

  const foundActors = [] as string[];
  const allActors = await Actor.getAll();

  allActors.forEach(actor => {
    if (perms.includes(actor.name.toLowerCase())) {
      foundActors.push(actor._id);
    } else if (
      actor.aliases.some(alias => perms.includes(alias.toLowerCase()))
    ) {
      foundActors.push(actor._id);
    }
  });
  return foundActors;
}
