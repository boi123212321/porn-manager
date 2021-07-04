import gql from "graphql-tag";

export default gql`
  fragment MovieFragment on Movie {
    _id
    name
    releaseDate
    description
    rating
    favorite
    bookmark
    labels {
      _id
      name
      color
    }
    frontCover {
      _id
      color
      meta {
        dimensions {
          width
          height
        }
      }
    }
    backCover {
      _id
      meta {
        dimensions {
          width
          height
        }
      }
    }
    spineCover {
      _id
      meta {
        dimensions {
          width
          height
        }
      }
    }
    studio {
      _id
      name
    }
    duration
    size
  }
`;
