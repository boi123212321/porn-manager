import { gql } from "apollo-server-express";

export default gql`
  type Marker {
    _id: String!
    name: String!
    time: Int!
    rating: Int
    favorite: Boolean
    bookmark: Long

    # Resolvers
    scene: Scene
    labels: [Label!]!
    actors: [Actor!]!
    thumbnail: Image
  }

  type MarkerSearchResults {
    numItems: Int!
    numPages: Int!
    items: [Marker!]!
  }

  input MarkerSearchQuery {
    query: String
    favorite: Boolean
    bookmark: Boolean
    rating: Int
    include: [String!]
    exclude: [String!]
    sortBy: String
    sortDir: String
    skip: Int
    take: Int
    page: Int

    rawQuery: Json
  }

  extend type Query {
    getMarkers(query: MarkerSearchQuery!, seed: String): MarkerSearchResults!
  }

  input MarkerUpdateOpts {
    favorite: Boolean
    bookmark: Long
    actors: [String!]
    name: String
    rating: Int
    labels: [String!]
  }

  extend type Mutation {
    createMarker(
      scene: String!
      name: String!
      time: Int!
      rating: Int
      favorite: Boolean
      bookmark: Long
      labels: [String!]
      actors: [String!]
    ): Marker!
    updateMarkers(ids: [String!]!, opts: MarkerUpdateOpts!): [Marker!]!
    removeMarkers(ids: [String!]!): Boolean!
  }
`;
