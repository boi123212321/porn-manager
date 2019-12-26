import ApolloClient from "../apollo";
import gql from "graphql-tag";
import IScene from "@/types/scene";
import { sceneModule } from "../store/scene";

export function watch(scene: IScene) {
  ApolloClient.mutate({
    mutation: gql`
      mutation($id: String!) {
        watchScene(id: $id) {
          watches
        }
      }
    `,
    variables: {
      id: scene._id
    }
  })
    .then(res => {
      sceneModule.pushWatch(res.data.watchScene.watches.pop());
    })
    .catch(err => {
      console.error(err);
    });
}

export function unwatch(scene: IScene) {
  ApolloClient.mutate({
    mutation: gql`
      mutation($id: String!) {
        unwatchScene(id: $id) {
          watches
        }
      }
    `,
    variables: {
      id: scene._id
    }
  })
    .then(res => {
      sceneModule.popWatch();
    })
    .catch(err => {
      console.error(err);
    });
}
