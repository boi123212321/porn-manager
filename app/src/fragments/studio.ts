import gql from "graphql-tag";

export default gql`
  fragment StudioFragment on Studio {
    _id
    name
    thumbnail {
      _id
    }
    labels {
      _id
      name
    }
    numScenes
    rating
    favorite
    bookmark
  }
`;
