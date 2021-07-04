import { gql } from "apollo-server-express";

export default gql`
  type MovieSearchResults {
    numItems: Int!
    numPages: Int!
    items: [Movie!]!
  }

  input MovieSearchQuery {
    query: String
    favorite: Boolean
    bookmark: Boolean
    rating: Int
    include: [String!]
    exclude: [String!]
    studios: [String!]
    actors: [String!]
    sortBy: String
    sortDir: String
    skip: Int
    take: Int
    page: Int
    durationMin: Int
    durationMax: Int

    rawQuery: Json
  }

  extend type Query {
    numMovies: Int!
    getMovies(query: MovieSearchQuery!, seed: String): MovieSearchResults!
    getMovieById(id: String!): Movie
  }

  type Movie {
    _id: String!
    name: String!
    description: String
    addedOn: Long!
    releaseDate: Long
    favorite: Boolean!
    bookmark: Long
    customFields: Object!

    # Resolvers
    rating: Int # Inferred from scene ratings
    frontCover: Image
    backCover: Image
    spineCover: Image
    scenes: [Scene!]!
    actors: [Actor!]!
    labels: [Label!]! # Inferred from scene labels
    duration: Long
    size: Long
    studio: Studio
  }

  input MovieUpdateOpts {
    name: String
    description: String
    releaseDate: Long
    frontCover: String
    backCover: String
    spineCover: String
    favorite: Boolean
    bookmark: Long
    rating: Int
    scenes: [String!]
    studio: String
    customFields: Object
  }

  extend type Mutation {
    addMovie(name: String!, scenes: [String!]): Movie!
    updateMovies(ids: [String!]!, opts: MovieUpdateOpts!): [Movie!]!
    removeMovies(ids: [String!]!): Boolean!
  }
`;
