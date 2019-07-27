const { GraphQLServer } = require("graphql-yoga");

const schema = require("./schema");
const { constructDataLoaders } = require("./api");

const server = new GraphQLServer({
  schema,
  context: req => {
    const authorization = req.request.get("Authorization");
    const userToken = req.request.get("Music-User-Token");
    const loaders = constructDataLoaders(authorization, userToken);
    return { ...loaders, userToken, authorization };
  },
});

server.start(() =>
  console.log(`The server is running on http://localhost:4000`)
);
