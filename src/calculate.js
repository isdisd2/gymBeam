"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const axios = require("axios");
const CalculateHelperModule = require("./calculate-helper");
const dataUrl = "https://dev.aux.boxpi.com/case-study/products";
class Calculate {
    /**
     * Calculate route
     * @param dataIn
     * @returns
     */
    calculate(dataIn) {
        return __awaiter(this, void 0, void 0, function* () {
            let allPositions = [];
            for (let product of dataIn.productList) {
                let productUrl = `${dataUrl}/${product}/positions`;
                // Nacitaj pre kazdy produkty v liste jeho pozicie
                yield axios
                    .get(productUrl, {
                    method: "POST",
                    headers: {
                        "X-API-KEY": "MVGBMS0VQI555bTery9qJ91BfUpi53N24SkKMf9Z",
                    },
                })
                    .then((response) => {
                    // kalkuluj len tie produkty, ktore maju definovane pozicie
                    if (response.data.length > 0) {
                        allPositions = [...allPositions, ...response.data];
                    }
                })
                    .catch((error) => {
                    throw Error("Error reading https://dev.aux.boxpi.com/case-study: " +
                        error);
                });
            }
            // return allPositions;
            const route = CalculateHelperModule.findRoute(dataIn.productList, allPositions, dataIn.startPosition);
            return route;
        });
    }
}
module.exports = new Calculate();
