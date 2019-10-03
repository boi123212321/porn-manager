export default `
scalar Long

type VideoDimensions {
  width: Long
  height: Long
}

type ImageMeta {
  size: Long
}

type SceneMeta {
  size: Long
  duration: Int
  dimensions: VideoDimensions!
}

type Query {
  getImages: [Image]

  getSceneById(id: String!): Scene
  getScenes: [Scene]

  getActorById(id: String!): Actor
  findActors(name: String!): [Actor]
  getActors: [Actor]

  getLabelById(id: String!): Label
  findLabel(name: String!): Label
  getLabels: [Label]
}

type Actor {
  id: String!
  name: String!
  aliases: [String!]!
  addedOn: Long!
  bornOn: Long
  images: [Image!]!
  favorite: Boolean!
  bookmark: Boolean!
  rating: Int
  labels: [Label!]!
  scenes: [Scene!]
  #customFields
}

type Label {
  id: String!
  name: String!
  aliases: [String!]!
  addedOn: Long!
  image: String
}

type Scene {
  id: String!
  name: String!
  addedOn: Long!
  releaseDate: String
  images: [Image!]!
  favorite: Boolean!
  bookmark: Boolean!
  rating: Int
  actors: [Actor!]!
  labels: [Label!]!
  path: String
  streamLinks: [String!]!
  watches: [Long!]!
  meta: SceneMeta!
  #customFields
}

type Image {
  id: String!
  name: String!
  path: String!
  addedOn: Long!
  favorite: Boolean!
  bookmark: Boolean!
  rating: Int
  #customFields
  labels: [Label!]!
  size: ImageMeta!
  scene: Scene
  actors: [Actor!]!
}

type Mutation {
  addActor(name: String!, aliases: [String!]): Actor
  
  addLabel(name: String!, aliases: [String!]): Label
  updateLabel(id: String!, name: String, aliases: [String!]): Label
  removeLabel(id: String!): Boolean
  
  setSceneLabels(id: String!, labels: [String!]!): Scene
  setActorLabels(id: String!, labels: [String!]!): Actor
  
  addScene(name: String!, actors: [String!], labels: [String!]): Scene
  uploadScene(file: Upload!, name: String, actors: [String!], labels: [String!]): Scene
}
`;