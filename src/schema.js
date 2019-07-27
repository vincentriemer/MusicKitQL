const {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
} = require("graphql");
const {
  nodeDefinitions,
  fromGlobalId,
  globalIdField,
  connectionDefinitions,
  getOffsetWithDefault,
  connectionArgs,
} = require("graphql-relay");

const {
  rootConnectionRequest,
  relationshipConnectionRequest,
} = require("./api");

const { nodeInterface, nodeField } = nodeDefinitions(
  (globalId, context) => {
    const { type, id } = fromGlobalId(globalId);
    switch (type) {
      case "LibraryAlbum":
        return context.albumLoader.load(id);
      case "LibraryPlaylist":
        return context.playlistLoader.load(id);
      case "LibraryArtist":
        return context.artistLoader.load(id);
      case "LibrarySong":
        return context.songLoader.load(id);
    }
  },
  obj => {
    switch (obj.type) {
      case "library-albums":
        return libraryAlbumType;
      case "library-playlists":
        return libraryPlaylistType;
      case "library-artists":
        return libraryArtistType;
      case "library-songs":
        return librarySongType;
    }
  }
);

const artworkType = new GraphQLObjectType({
  name: "Artwork",
  fields: () => ({
    bgColor: { type: GraphQLString },
    textColor1: { type: GraphQLString },
    textColor2: { type: GraphQLString },
    textColor3: { type: GraphQLString },
    textColor4: { type: GraphQLString },
    width: { type: GraphQLInt },
    height: { type: new GraphQLNonNull(GraphQLInt) },
    url: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

const playParametersType = new GraphQLObjectType({
  name: "PlayParameters",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    kind: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

const libraryAlbumType = new GraphQLObjectType({
  name: "LibraryAlbum",
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField(),
    type: { type: new GraphQLNonNull(GraphQLString) },
    artistName: { type: new GraphQLNonNull(GraphQLString) },
    artwork: { type: new GraphQLNonNull(artworkType) },
    contentRating: { type: GraphQLString },
    name: { type: new GraphQLNonNull(GraphQLString) },
    playParams: { type: playParametersType },
    trackCount: { type: new GraphQLNonNull(GraphQLInt) },
    artists: {
      type: libraryArtistConnection,
      args: connectionArgs,
      resolve: relationshipConnectionRequest("/albums", "/artists"),
    },
    tracks: {
      type: librarySongConnection,
      args: connectionArgs,
      resolve: relationshipConnectionRequest("/albums", "/tracks"),
    },
  }),
});

const { connectionType: libraryAlbumConnection } = connectionDefinitions({
  nodeType: libraryAlbumType,
});

const libraryPlaylistType = new GraphQLObjectType({
  name: "LibraryPlaylist",
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField(),
    type: { type: new GraphQLNonNull(GraphQLString) },
    artwork: { type: artworkType },
    description: { type: GraphQLString },
    name: { type: new GraphQLNonNull(GraphQLString) },
    playParams: { type: playParametersType },
    canEdit: { type: new GraphQLNonNull(GraphQLBoolean) },
    tracks: {
      type: librarySongConnection,
      args: connectionArgs,
      resolve: relationshipConnectionRequest("/playlists", "/tracks"),
    },
  }),
});

const { connectionType: libraryPlaylistConnection } = connectionDefinitions({
  nodeType: libraryPlaylistType,
});

const libraryArtistType = new GraphQLObjectType({
  name: "LibraryArtist",
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField(),
    type: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    albums: {
      type: libraryAlbumConnection,
      args: connectionArgs,
      resolve: relationshipConnectionRequest("/artists", "/albums"),
    },
  }),
});

const { connectionType: libraryArtistConnection } = connectionDefinitions({
  nodeType: libraryArtistType,
});

const librarySongType = new GraphQLObjectType({
  name: "LibrarySong",
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField(),
    mkId: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: source => source.id,
    },
    type: { type: new GraphQLNonNull(GraphQLString) },
    albumName: { type: new GraphQLNonNull(GraphQLString) },
    artistName: { type: new GraphQLNonNull(GraphQLString) },
    artwork: { type: new GraphQLNonNull(artworkType) },
    contentRating: { type: GraphQLString },
    discNumber: { type: new GraphQLNonNull(GraphQLInt) },
    durationInMillis: { type: GraphQLInt },
    name: { type: new GraphQLNonNull(GraphQLString) },
    playParams: { type: playParametersType },
    trackNumber: { type: new GraphQLNonNull(GraphQLInt) },
    albums: {
      type: libraryAlbumConnection,
      args: connectionArgs,
      resolve: relationshipConnectionRequest("/songs", "/albums"),
    },
    artists: {
      type: libraryArtistConnection,
      args: connectionArgs,
      resolve: relationshipConnectionRequest("/songs", "/artists"),
    },
  }),
});

const { connectionType: librarySongConnection } = connectionDefinitions({
  nodeType: librarySongType,
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      node: nodeField,
      libraryAlbums: {
        type: libraryAlbumConnection,
        args: connectionArgs,
        resolve: rootConnectionRequest("/albums"),
      },
      libraryPlaylists: {
        type: libraryPlaylistConnection,
        args: connectionArgs,
        resolve: rootConnectionRequest("/playlists"),
      },
      libraryArtists: {
        type: libraryArtistConnection,
        args: connectionArgs,
        resolve: rootConnectionRequest("/artists"),
      },
    },
  }),
});

module.exports = schema;
