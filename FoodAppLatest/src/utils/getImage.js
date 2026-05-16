export const getImage = (url) => {
    if (!url || typeof url !== "string") {
        return require("../assets/images/placeholder-restaurant.png");
    }

    if (url.startsWith("http")) {
        return { uri: url };
    }

    return require("../assets/images/placeholder-restaurant.png");
};