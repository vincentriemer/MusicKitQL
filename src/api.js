const DataLoader = require("dataloader");
const fetch = require("node-fetch");
const querystring = require("querystring");
const { getOffsetWithDefault } = require("graphql-relay");
const {
  connectionFromArray,
  transformToForward,
} = require("graphql-connection");

const BASE_URI = `https://api.music.apple.com/v1/me/library`;

function normalizeResponseData(res) {
  return {
    id: res.id,
    type: res.type,
    ...res.attributes,
    ...res.relationships,
  };
}

async function musicKitRequest(authorization, userToken, path, params = {}) {
  const res = await fetch(
    `${BASE_URI}${path}?${querystring.stringify(params)}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
        "Music-User-Token": userToken,
      },
    }
  ).then(res => {
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    return res.json();
  });

  return res;
}

function createBatchLoader(authorization, userToken, path) {
  return async ids => {
    const rawResult = await musicKitRequest(authorization, userToken, path, {
      ids: ids.join(","),
    });
    return rawResult.data.map(normalizeResponseData);
  };
}

function constructDataLoaders(authorization, userToken) {
  return {
    albumLoader: new DataLoader(
      createBatchLoader(authorization, userToken, "/albums")
    ),
    playlistLoader: new DataLoader(
      createBatchLoader(authorization, userToken, "/playlists")
    ),
    artistLoader: new DataLoader(
      createBatchLoader(authorization, userToken, "/artists")
    ),
    songLoader: new DataLoader(
      createBatchLoader(authorization, userToken, "/songs")
    ),
  };
}

function rootConnectionRequest(path) {
  return async (parent, args, ctx) => {
    const { first, after } = transformToForward(args);
    const res = await musicKitRequest(ctx.authorization, ctx.userToken, path, {
      limit: first + 1,
      offset: getOffsetWithDefault(after, -1) + 1,
    });
    const array = res.data.map(normalizeResponseData);
    return connectionFromArray(array, { first, after });
  };
}

const relationshipConnectionRequest = (source, target) => async (
  parent,
  args,
  ctx
) => {
  const { first, after } = transformToForward(args);

  const id = parent.id;
  const res = await musicKitRequest(
    ctx.authorization,
    ctx.userToken,
    `/${source}/${id}/${target}`,
    {
      limit: first + 1,
      offset: getOffsetWithDefault(after, -1) + 1,
    }
  );

  const array = res.data.map(normalizeResponseData);
  return connectionFromArray(array, { first, after });
};

module.exports = {
  constructDataLoaders,
  normalizeResponseData,
  musicKitRequest,
  rootConnectionRequest,
  relationshipConnectionRequest,
};
