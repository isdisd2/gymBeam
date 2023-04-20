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
    async calculate(dataIn: any) {
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

        // usporiadaj podla podlazia
        allPositions.sort((a: { z: number }, b: { z: number }) => a.z - b.z);

        // return allPositions;
        const route = this._findRoute(
            dataIn.productList,
            allPositions,
            dataIn.startPosition
        );
        return route;
    }

    _findRoute(productListAll: any, allPositions: any, startPosition: any) {
        let floor = startPosition.z;
        let itemsLeft = [...productListAll]; //este nenajdene tovary
        
        // prejdi vsetky poschodia
        const route = this._traceFloors(
            allPositions,
            floor,
            productListAll,
            itemsLeft,
            startPosition
        );
        return route;
    }

    _traceFloors(
        allPositions: any,
        floor: number,
        productListAll: any,
        itemsLeft: any,
        startPosition: any
    ) {
        let routeItems: any = [];
        let routeLengthItems: any = [];

        // vyber vsetky pozicie na danom poschodi
        const floorPositions = allPositions.filter(
            (item: any) =>
                item.z === floor && productListAll.includes(item.productId)
        );

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
        let itemsOnFloor = floorPositions.map((pos: any) => pos.productId);
        itemsOnFloor = [...new Set(itemsOnFloor)];

        // ponechaj na hladanie len tie produkty, ktore sa nenasli na danom poschodi
        itemsLeft = itemsLeft.filter((x: string) => !itemsOnFloor.includes(x));

        // vyber vsetky pozicie hladanych tovarov na poschodi a ich vzdialenosti od vozika
        ({ routeLengthItems, routeItems } = this._traceOneFloor(
            itemsOnFloor,
            routeItems,
            routeLengthItems,
            startPosition,
            floorPositions
        ));

        // oznac najblizsi tovar za najdeny
        let routeLength = routeLengthItems.reduce(function (
            a: number,
            b: number
        ) {
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

    _traceOneFloor(
        itemsLeft: any,
        routeItems: any,
        routeLengthItems: any,
        startPosition: any,
        floorPositions: any
    ) {
        let allDistances = [];
        for (const position of floorPositions) {
            allDistances.push({
                productId: position.productId,
                positionId: position.positionId,
                x: position.x,
                y: position.y,
                z: position.z,
                distance: this._getDistance(
                    [startPosition.x, startPosition.y, startPosition.z],
                    [position.x, position.y, position.z]
                ),
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
        floorPositions = floorPositions.filter(
            (item: any) => item.productId !== nearest.productId
        );

        // ak je co hladat chod hladat dalsi produkt
        if (itemsLeft.length > 0) {
            this._traceOneFloor(
                itemsLeft,
                routeItems,
                routeLengthItems,
                { x: nearest.x, y: nearest.y, z: nearest.z },
                floorPositions
            );
        }

        return { routeLengthItems, routeItems };
    }

    _getDistance(point1: any, point2: any) {
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
