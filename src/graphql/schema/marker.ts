import { gql } from "apollo-server-express";

export default gql`
  type Marker {
    _id: String!
    name: String!
    time: Int!
    rating: Int
    favorite: Boolean
    bookmark: Boolean
  }

  extend type Mutation {
    createMarker(
      scene: String!
      name: String!
      time: Int!
      rating: Int
      favorite: Boolean
      bookmark: Boolean
    ): Marker!
    removeMarkers(ids: [String!]!): Boolean!
  }
`;
