"use strict";

const axios = require("axios");
const CalculateHelperModule = require("./calculate-helper");

const dataUrl = "https://dev.aux.boxpi.com/case-study/products";

interface Point {
    X: number;
    Y: number;
    Z: number;
}

interface InputData {
    productList: string[];
    startPosition: Point;
}

class Calculate {
    /**
     * Calculate route
     * @param dataIn
     * @returns
     */
    async calculate(dataIn: InputData) {
        let allPositions: any = [];
        for (let product of dataIn.productList) {
            let productUrl = `${dataUrl}/${product}/positions`;

            // Nacitaj pre kazdy produkty v liste jeho pozicie
            await axios
                .get(productUrl, {
                    method: "POST",
                    headers: {
                        "X-API-KEY": "MVGBMS0VQI555bTery9qJ91BfUpi53N24SkKMf9Z",
                    },
                })
                .then((response: any) => {
                    // kalkuluj len tie produkty, ktore maju definovane pozicie
                    if (response.data.length > 0) {
                        allPositions = [...allPositions, ...response.data];
                    }
                })
                .catch((error: any) => {
                    throw Error(
                        "Error reading https://dev.aux.boxpi.com/case-study: " +
                            error
                    );
                });
        }

        // return allPositions;
        const route = CalculateHelperModule.findRoute(
            dataIn.productList,
            allPositions,
            dataIn.startPosition
        );
        return route;
    }
}

module.exports = new Calculate();
