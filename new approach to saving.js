function saveAndLoadTrashAlbumList(trashAlbumList) {
  // Convert Map to object for serialization
  const mapToObject = (map) => {
    const obj = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  };

  // Convert object back to Map
  const objectToMap = (obj) => {
    return new Map(Object.entries(obj));
  };

  // Convert Map to string for saving
  const convertToString = () => {
    const trashAlbumListObject = mapToObject(trashAlbumList); // Convert Map to Object
    return JSON.stringify(trashAlbumListObject); // Convert Object to string
  };

  // Convert string back to Map
  const convertFromString = (str) => {
    const trashAlbumListObject = JSON.parse(str); // Parse string into Object
    return objectToMap(trashAlbumListObject); // Convert Object back to Map
  };

  // Save the data to LocalStorage (as string)
  const savedData = convertToString();
  Spicetify.LocalStorage.set("HideImages_TrashAlbumList", savedData);

  // Retrieve and convert back to Map when needed
  const loadedData = Spicetify.LocalStorage.get("HideImages_TrashAlbumList");
  if (loadedData) {
    const trashAlbumListFromStorage = convertFromString(loadedData); // Convert back to Map
    return trashAlbumListFromStorage;
  }
  
  return null; // If no data found
}


function saveAndLoadTrashArtistList(trashArtistList){

  // Convert object to string for saving
  const convertToString = () => {
    return JSON.stringify(trashArtistList);  // Convert object to JSON string
  };

  // Convert string back to object
  const convertFromString = (str) => {
    return JSON.parse(str);  // Parse JSON string back to object
  };

  // Save the data to LocalStorage (as string)
  const savedData = convertToString();
  Spicetify.LocalStorage.set("HideImages_TrashArtistList", savedData);

  // Retrieve and convert back to object when needed
  const loadedData = Spicetify.LocalStorage.get("HideImages_TrashArtistList");
  if (loadedData) {
    const trashArtistListFromStorage = convertFromString(loadedData);  // Convert string back to object
    return trashArtistListFromStorage;
  }

  return null;  // If no data found
}
