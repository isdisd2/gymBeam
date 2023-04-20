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
var dataUrl = "https://dev.aux.boxpi.com/case-study/products";
// interface Point {
//     X: number;
//     Y: number;
//     Z: number;
//   }
//   interface InputData {
//     productList: string[];
//     startPosition: Point;
//   }
class Calculate {
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
            // usporiadaj podla podlazia
            allPositions.sort((a, b) => a.z - b.z);
            // return allPositions;
            const route = this._findRoute(dataIn.productList, allPositions, dataIn.startPosition);
            return route;
        });
    }
    _findRoute(productListAll, allPositions, startPosition) {
        let floor = startPosition.z;
        let itemsLeft = [...productListAll]; //este nenajdene tovary
        // prejdi vsetky poschodia
        const route = this._traceFloors(allPositions, floor, productListAll, itemsLeft, startPosition);
        return route;
    }
    _traceFloors(allPositions, floor, productListAll, itemsLeft, startPosition) {
        let routeItems = [];
        let routeLengthItems = [];
        // vyber vsetky pozicie na danom poschodi
        const floorPositions = allPositions.filter((item) => item.z === floor && productListAll.includes(item.productId));
        if (floorPositions.length === 0) {
            // ak neexistuje na danom poschodi hladany tovar, koniec hladania
            return {
                floor,
                routeLength: 0,
                routeLengthItems,
                routeItems,
                itemsLeft,
            };
        }
        // vyber len tie produkty, ktore sa nachadzaju na poschodi
        let itemsOnFloor = floorPositions.map((pos) => pos.productId);
        itemsOnFloor = [...new Set(itemsOnFloor)];
        // ponechaj na hladanie len tie produkty, ktore sa nenasli na danom poschodi
        itemsLeft = itemsLeft.filter((x) => !itemsOnFloor.includes(x));
        // vyber vsetky pozicie hladanych tovarov na poschodi a ich vzdialenosti od vozika
        ({ routeLengthItems, routeItems } = this._traceOneFloor(itemsOnFloor, routeItems, routeLengthItems, startPosition, floorPositions));
        // oznac najblizsi tovar za najdeny
        let routeLength = routeLengthItems.reduce(function (a, b) {
            return a + b;
        });
        return {
            routeItems,
            routeLength,
            floor,
            routeLengthItems,
            itemsLeft,
        };
    }
    _traceOneFloor(itemsLeft, routeItems, routeLengthItems, startPosition, floorPositions) {
        let allDistances = [];
        for (const position of floorPositions) {
            allDistances.push({
                productId: position.productId,
                positionId: position.positionId,
                x: position.x,
                y: position.y,
                z: position.z,
                distance: this._getDistance([startPosition.x, startPosition.y, startPosition.z], [position.x, position.y, position.z]),
            });
        }
        // najdi najblizsi tovar na poschodi od miesta kde som
        let nearest = allDistances.sort((a, b) => a.distance - b.distance)[0];
        // chod k najblisiemu, zapametaj si dlzku trasy a poziciu, kadial siel
        routeLengthItems.push(nearest.distance);
        routeItems.push({
            productId: nearest.productId,
            positionId: nearest.positionId,
            x: nearest.x,
            y: nearest.y,
            z: nearest.z,
        });
        // zmaz najdenu z pola hladanych
        const index = itemsLeft.indexOf(nearest.productId);
        itemsLeft.splice(index, 1);
        // zmaz pozicie najdeneho produktu
        floorPositions = floorPositions.filter((item) => item.productId !== nearest.productId);
        // ak je co hladat chod hladat dalsi produkt
        if (itemsLeft.length > 0) {
            this._traceOneFloor(itemsLeft, routeItems, routeLengthItems, { x: nearest.x, y: nearest.y, z: nearest.z }, floorPositions);
        }
        return { routeLengthItems, routeItems };
    }
    _getDistance(point1, point2) {
        const [x1, y1, z1] = point1;
        const [x2, y2, z2] = point2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return dist;
    }
}
module.exports = new Calculate();
