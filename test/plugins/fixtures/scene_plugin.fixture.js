const mockScene = {
  name: "mock scene name",
  // path: "mock scene path",
  description: "mock scene description",
  // Use a constant date, so individual imports will have same date
  releaseDate: new Date("2020-10-09T07:49:52.636Z").valueOf(),
  addedOn: new Date("2020-10-09T07:49:52.636Z").valueOf(),
  rating: 5,
  favorite: true,
  actors: ["existing actor name"],
  bookmark: 1,
  studio: "existing studio",
  labels: ["existing scene label"],
};

const plugin = async ({ $createLocalImage, $createImage }) => {
  // Create existing image
  const existingImage = await $createLocalImage(
    "test/fixtures/files/image001.jpg",
    mockScene.name + " image001",
    false
  );

  await $createImage(
    "https://picsum.photos/seed/picsum/400/400.jpg",
    mockScene.name + " image001",
    false
  );

  return {
    ...mockScene,
    thumbnail: await $createImage(
      "https://picsum.photos/seed/picsum/200/300.jpg",
      mockScene.name + " thumbnail",
      true
    ),
    existingImage,
  };
};

// Attach the result to the exported plugin
// so tests can use it to compare the result
plugin.result = mockScene;

module.exports = plugin;
