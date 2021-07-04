import ApolloClient from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { setContext } from "apollo-link-context";
import { createUploadLink } from "apollo-upload-client";

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      "X-PASS": localStorage.getItem("password"),
    },
  };
});

export default new ApolloClient({
  link: authLink.concat(createUploadLink({ uri: "/api/ql" })),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "no-cache", errorPolicy: "ignore" },
    query: { fetchPolicy: "no-cache", errorPolicy: "all" },
  },
});
